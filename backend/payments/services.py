from datetime import date, datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from members.models import Member
from staff.models import Staff

from .models import (
    MemberFeeCycle,
    MemberFeePayment,
    MemberFeePlan,
    StaffSalaryPayment,
    StaffSalaryPeriod,
    first_day_of_month,
)


ZERO = Decimal("0.00")


def _sync_billing_for_cycle(cycle_id: int):
    # Keep payments app decoupled from billing app to avoid hard dependency loops.
    try:
        from billing.services import sync_bill_for_cycle

        sync_bill_for_cycle(cycle_id)
    except Exception:
        return


def _calculate_attendance_adjusted_gross(staff: Staff, period_month: date) -> Decimal:
    month_start = first_day_of_month(period_month)
    current_month_start = first_day_of_month(timezone.localdate())

    # Keep in-progress and future months payable at base salary in v1 payroll flow.
    if month_start >= current_month_start:
        return Decimal(staff.monthly_salary)

    try:
        from attendance.services import calculate_payable_salary
    except Exception:
        return Decimal(staff.monthly_salary)

    try:
        metrics = calculate_payable_salary(staff, month_start)
        return Decimal(str(metrics["payable_salary"]))
    except Exception:
        # Fallback to base salary if attendance module is not ready during migrations.
        return Decimal(staff.monthly_salary)


def _to_month_start(value: date | datetime) -> date:
    if isinstance(value, datetime):
        return first_day_of_month(value.date())
    return first_day_of_month(value)


def _validate_plan_for_month(plan: MemberFeePlan, month_start: date):
    if plan.effective_from and month_start < first_day_of_month(plan.effective_from):
        raise ValidationError({"cycle_month": "Cycle month is before plan effective start date."})
    if plan.effective_to and month_start > first_day_of_month(plan.effective_to):
        raise ValidationError({"cycle_month": "Cycle month is after plan effective end date."})


def _member_cycle_status_from_remaining(net_due_amount: Decimal, remaining_amount: Decimal) -> str:
    if remaining_amount <= ZERO:
        return "paid"
    if remaining_amount >= net_due_amount:
        return "unpaid"
    return "partial"


def _staff_period_status_from_remaining(gross_salary: Decimal, remaining_amount: Decimal) -> str:
    if remaining_amount <= ZERO:
        return "paid"
    if remaining_amount >= gross_salary:
        return "unpaid"
    return "partial"


def get_or_create_member_cycle(
    member: Member,
    cycle_month: date,
    cycle_discount_override: Decimal | None = None,
) -> MemberFeeCycle:
    month_start = _to_month_start(cycle_month)
    plan = getattr(member, "fee_plan", None)
    if plan is None:
        raise ValidationError({"member_id": "No fee plan exists for the selected member."})

    _validate_plan_for_month(plan, month_start)

    cycle, created = MemberFeeCycle.objects.get_or_create(
        member=member,
        cycle_month=month_start,
        defaults={
            "plan": plan,
            "base_due_amount": plan.cycle_fee_amount,
            "cycle_discount_amount": (
                cycle_discount_override
                if cycle_discount_override is not None
                else plan.default_cycle_discount_amount
            ),
            "net_due_amount": plan.cycle_fee_amount
            - (
                cycle_discount_override
                if cycle_discount_override is not None
                else plan.default_cycle_discount_amount
            ),
            "paid_amount": ZERO,
            "payment_discount_amount": ZERO,
            "remaining_amount": plan.cycle_fee_amount
            - (
                cycle_discount_override
                if cycle_discount_override is not None
                else plan.default_cycle_discount_amount
            ),
            "status": "unpaid",
        },
    )

    if created:
        return cycle

    if cycle.plan_id != plan.id:
        cycle.plan = plan
        cycle.save(update_fields=["plan", "updated_at"])
    return cycle


def recalculate_member_cycle(cycle_id: int, *, sync_billing: bool = True) -> MemberFeeCycle:
    with transaction.atomic():
        cycle = MemberFeeCycle.objects.select_for_update().get(pk=cycle_id)
        aggregates = cycle.payments.aggregate(
            total_paid=Coalesce(Sum("amount_paid"), ZERO),
            total_discount=Coalesce(Sum("discount_amount"), ZERO),
        )

        paid_amount = Decimal(aggregates["total_paid"])
        payment_discount_amount = Decimal(aggregates["total_discount"])
        remaining_amount = cycle.net_due_amount - paid_amount - payment_discount_amount
        if remaining_amount < ZERO:
            raise ValidationError(
                {"amount_paid": "Payment and discount total cannot exceed cycle remaining amount."}
            )

        cycle.paid_amount = paid_amount
        cycle.payment_discount_amount = payment_discount_amount
        cycle.remaining_amount = remaining_amount
        cycle.status = _member_cycle_status_from_remaining(cycle.net_due_amount, remaining_amount)
        cycle.save(
            update_fields=[
                "paid_amount",
                "payment_discount_amount",
                "remaining_amount",
                "status",
                "updated_at",
            ]
        )
        if sync_billing:
            _sync_billing_for_cycle(cycle.id)
        return cycle


def create_member_payment(
    *,
    member: Member,
    amount_paid: Decimal,
    discount_amount: Decimal,
    payment_method: str,
    paid_at: datetime,
    note: str | None,
    created_by,
    cycle_id: int | None = None,
) -> MemberFeePayment:
    if amount_paid < ZERO:
        raise ValidationError({"amount_paid": "Amount paid must be greater than or equal to 0."})
    if discount_amount < ZERO:
        raise ValidationError(
            {"discount_amount": "Discount amount must be greater than or equal to 0."}
        )
    if amount_paid == ZERO and discount_amount == ZERO:
        raise ValidationError(
            {"amount_paid": "Amount paid and discount amount cannot both be zero."}
        )

    with transaction.atomic():
        if cycle_id:
            cycle = MemberFeeCycle.objects.select_for_update().get(pk=cycle_id)
            if cycle.member_id != member.id:
                raise ValidationError({"cycle_id": "Selected cycle does not belong to member."})
        else:
            month_start = _to_month_start(timezone.localtime(paid_at).date())
            cycle = get_or_create_member_cycle(member, month_start)
            cycle = MemberFeeCycle.objects.select_for_update().get(pk=cycle.id)

        cycle = recalculate_member_cycle(cycle.id)
        applied_total = amount_paid + discount_amount
        if applied_total > cycle.remaining_amount:
            raise ValidationError(
                {"amount_paid": "Payment and discount exceed remaining cycle amount."}
            )

        payment = MemberFeePayment.objects.create(
            member=member,
            cycle=cycle,
            amount_paid=amount_paid,
            discount_amount=discount_amount,
            payment_method=payment_method,
            paid_at=paid_at,
            note=note,
            is_reversal=False,
            reversal_of=None,
            created_by=created_by if getattr(created_by, "is_authenticated", False) else None,
        )
        recalculate_member_cycle(cycle.id)
        return payment


def reverse_member_payment(
    *,
    payment_id: int,
    reason: str | None,
    created_by,
) -> MemberFeePayment:
    with transaction.atomic():
        payment = MemberFeePayment.objects.select_for_update().get(pk=payment_id)
        if payment.is_reversal:
            raise ValidationError({"detail": "A reversal payment cannot be reversed again."})
        if hasattr(payment, "reversal_entry"):
            raise ValidationError({"detail": "Payment has already been reversed."})

        reversal = MemberFeePayment.objects.create(
            member=payment.member,
            cycle=payment.cycle,
            amount_paid=-payment.amount_paid,
            discount_amount=-payment.discount_amount,
            payment_method=payment.payment_method,
            paid_at=timezone.now(),
            note=reason or "Reversal entry",
            is_reversal=True,
            reversal_of=payment,
            created_by=created_by if getattr(created_by, "is_authenticated", False) else None,
        )
        recalculate_member_cycle(payment.cycle_id)
        return reversal


def get_or_create_staff_period(staff: Staff, period_month: date) -> StaffSalaryPeriod:
    month_start = _to_month_start(period_month)
    adjusted_gross = _calculate_attendance_adjusted_gross(staff, month_start)
    period, created = StaffSalaryPeriod.objects.get_or_create(
        staff=staff,
        period_month=month_start,
        defaults={
            "gross_salary_amount": adjusted_gross,
            "paid_amount": ZERO,
            "remaining_amount": adjusted_gross,
            "status": "unpaid",
            "currency": "AFN",
        },
    )
    if not created and period.gross_salary_amount != adjusted_gross:
        period.gross_salary_amount = adjusted_gross
        remaining_amount = adjusted_gross - Decimal(period.paid_amount)
        if remaining_amount < ZERO:
            raise ValidationError(
                {"detail": "Attendance-adjusted salary is below already paid salary for this period."}
            )
        period.remaining_amount = remaining_amount
        period.status = _staff_period_status_from_remaining(adjusted_gross, remaining_amount)
        period.save(
            update_fields=["gross_salary_amount", "remaining_amount", "status", "updated_at"]
        )
    return period


def sync_staff_salary_status(staff_id: int):
    staff = Staff.objects.get(pk=staff_id)
    current_month = first_day_of_month(timezone.localdate())
    period = (
        StaffSalaryPeriod.objects.filter(staff_id=staff.id, period_month=current_month)
        .order_by("-id")
        .first()
    )
    target_status = period.status if period else "unpaid"
    if staff.salary_status != target_status:
        staff.salary_status = target_status
        staff.save(update_fields=["salary_status", "updated_at"])


def recalculate_staff_period(period_id: int) -> StaffSalaryPeriod:
    with transaction.atomic():
        period = StaffSalaryPeriod.objects.select_for_update().get(pk=period_id)
        adjusted_gross = _calculate_attendance_adjusted_gross(period.staff, period.period_month)
        aggregates = period.payments.aggregate(total_paid=Coalesce(Sum("amount_paid"), ZERO))
        paid_amount = Decimal(aggregates["total_paid"])
        remaining_amount = adjusted_gross - paid_amount
        if remaining_amount < ZERO:
            raise ValidationError({"amount_paid": "Payment total cannot exceed period salary amount."})

        period.gross_salary_amount = adjusted_gross
        period.paid_amount = paid_amount
        period.remaining_amount = remaining_amount
        period.status = _staff_period_status_from_remaining(
            adjusted_gross, remaining_amount
        )
        period.save(
            update_fields=[
                "gross_salary_amount",
                "paid_amount",
                "remaining_amount",
                "status",
                "updated_at",
            ]
        )
        sync_staff_salary_status(period.staff_id)
        return period


def create_staff_salary_payment(
    *,
    staff: Staff,
    amount_paid: Decimal,
    payment_method: str,
    paid_at: datetime,
    note: str | None,
    created_by,
    period_id: int | None = None,
) -> StaffSalaryPayment:
    if amount_paid <= ZERO:
        raise ValidationError({"amount_paid": "Amount paid must be greater than 0."})

    with transaction.atomic():
        if period_id:
            period = StaffSalaryPeriod.objects.select_for_update().get(pk=period_id)
            if period.staff_id != staff.id:
                raise ValidationError({"period_id": "Selected period does not belong to staff."})
        else:
            month_start = _to_month_start(timezone.localtime(paid_at).date())
            period = get_or_create_staff_period(staff, month_start)
            period = StaffSalaryPeriod.objects.select_for_update().get(pk=period.id)

        period = recalculate_staff_period(period.id)
        if amount_paid > period.remaining_amount:
            raise ValidationError({"amount_paid": "Payment amount exceeds remaining salary amount."})

        payment = StaffSalaryPayment.objects.create(
            staff=staff,
            period=period,
            amount_paid=amount_paid,
            payment_method=payment_method,
            paid_at=paid_at,
            note=note,
            is_reversal=False,
            reversal_of=None,
            created_by=created_by if getattr(created_by, "is_authenticated", False) else None,
        )
        recalculate_staff_period(period.id)
        return payment


def reverse_staff_salary_payment(
    *,
    payment_id: int,
    reason: str | None,
    created_by,
) -> StaffSalaryPayment:
    with transaction.atomic():
        payment = StaffSalaryPayment.objects.select_for_update().get(pk=payment_id)
        if payment.is_reversal:
            raise ValidationError({"detail": "A reversal payment cannot be reversed again."})
        if hasattr(payment, "reversal_entry"):
            raise ValidationError({"detail": "Payment has already been reversed."})

        reversal = StaffSalaryPayment.objects.create(
            staff=payment.staff,
            period=payment.period,
            amount_paid=-payment.amount_paid,
            payment_method=payment.payment_method,
            paid_at=timezone.now(),
            note=reason or "Reversal entry",
            is_reversal=True,
            reversal_of=payment,
            created_by=created_by if getattr(created_by, "is_authenticated", False) else None,
        )
        recalculate_staff_period(payment.period_id)
        return reversal
