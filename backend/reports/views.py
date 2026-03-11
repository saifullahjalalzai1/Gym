from decimal import Decimal

from django.db.models import Count, Min, OuterRef, Q, Subquery, Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import StandardResultsSetPagination
from core.permissions import PermissionMixin
from members.models import Member
from payments.models import MemberFeeCycle, MemberFeePayment

from .models import Expense
from .serializers import (
    ActiveMemberReportSerializer,
    DashboardActivityQuerySerializer,
    DashboardActivitySerializer,
    DashboardAlertsQuerySerializer,
    DashboardAlertsSerializer,
    DashboardOverviewSerializer,
    ExpenseRecentSerializer,
    ExpenseSerializer,
    MonthsQuerySerializer,
    PaymentHistoryReportSerializer,
    RecentExpenseQuerySerializer,
    UnpaidMemberReportSerializer,
)
from .services import (
    ZERO,
    build_active_members_count,
    build_analytics_overview,
    build_current_month_expense_total,
    build_dashboard_activity,
    build_dashboard_alerts,
    build_dashboard_overview,
    build_income_monthly_report,
    build_total_unpaid_members_balance,
)


class ExpenseViewSet(
    PermissionMixin,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Expense.objects.select_related("created_by").order_by("-expense_date", "-id")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    permission_module = "reports"
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")

        if date_from:
            queryset = queryset.filter(expense_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(expense_date__lte=date_to)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            search_text = search.strip()
            if search_text:
                queryset = queryset.filter(
                    Q(expense_name__icontains=search_text) | Q(note__icontains=search_text)
                )
        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user
            if getattr(self.request.user, "is_authenticated", False)
            else None
        )

    @action(detail=False, methods=["get"], permission_action="view", url_path="recent")
    def recent(self, request):
        query_serializer = RecentExpenseQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        limit = query_serializer.validated_data["limit"]

        expenses = self.get_queryset()[:limit]
        output = ExpenseRecentSerializer(expenses, many=True)
        return Response(output.data, status=status.HTTP_200_OK)


class ActiveMembersReportAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        search = request.query_params.get("search")
        latest_paid_cycle_month = (
            MemberFeeCycle.objects.filter(member_id=OuterRef("pk"), status="paid")
            .order_by("-cycle_month")
            .values("cycle_month")[:1]
        )

        queryset = (
            Member.objects.filter(status="active")
            .select_related("fee_plan")
            .annotate(latest_paid_cycle_month=Subquery(latest_paid_cycle_month))
            .order_by("last_name", "first_name", "id")
        )
        if search:
            search_text = search.strip()
            if search_text:
                queryset = queryset.filter(
                    Q(member_code__icontains=search_text)
                    | Q(first_name__icontains=search_text)
                    | Q(last_name__icontains=search_text)
                )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = ActiveMemberReportSerializer(page if page is not None else queryset, many=True)
        if page is not None:
            return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UnpaidMembersReportAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        search = request.query_params.get("search")
        queryset = (
            Member.objects.filter(status="active")
            .annotate(
                remaining_balance=Coalesce(
                    Sum("fee_cycles__remaining_amount", filter=Q(fee_cycles__remaining_amount__gt=0)),
                    ZERO,
                ),
                outstanding_cycles_count=Count(
                    "fee_cycles",
                    filter=Q(fee_cycles__remaining_amount__gt=0),
                ),
                oldest_unpaid_cycle_month=Min(
                    "fee_cycles__cycle_month",
                    filter=Q(fee_cycles__remaining_amount__gt=0),
                ),
            )
            .filter(remaining_balance__gt=Decimal("0.00"))
            .order_by("-remaining_balance", "last_name", "first_name", "id")
        )
        if search:
            search_text = search.strip()
            if search_text:
                queryset = queryset.filter(
                    Q(member_code__icontains=search_text)
                    | Q(first_name__icontains=search_text)
                    | Q(last_name__icontains=search_text)
                )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = UnpaidMemberReportSerializer(page if page is not None else queryset, many=True)
        if page is not None:
            return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentHistoryReportAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = MemberFeePayment.objects.select_related("member").order_by("-paid_at", "-id")
        member_id = request.query_params.get("member_id")
        payment_method = request.query_params.get("payment_method")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if member_id:
            queryset = queryset.filter(member_id=member_id)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if date_from:
            queryset = queryset.filter(paid_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(paid_at__date__lte=date_to)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = PaymentHistoryReportSerializer(page if page is not None else queryset, many=True)
        if page is not None:
            return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MonthlyIncomeReportAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"

    def get(self, request):
        query_serializer = MonthsQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        months = query_serializer.validated_data["months"]
        report = build_income_monthly_report(months)
        return Response(report, status=status.HTTP_200_OK)


class AnalyticsOverviewReportAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"

    def get(self, request):
        query_serializer = MonthsQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        months = query_serializer.validated_data["months"]
        payload = build_analytics_overview(months)
        return Response(payload, status=status.HTTP_200_OK)


class DashboardOverviewAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"

    def get(self, request):
        query_serializer = MonthsQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        months = query_serializer.validated_data["months"]

        payload = build_dashboard_overview(months)
        serializer = DashboardOverviewSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardActivityAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"

    def get(self, request):
        query_serializer = DashboardActivityQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        limit = query_serializer.validated_data["limit"]

        payload = build_dashboard_activity(limit)
        serializer = DashboardActivitySerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardAlertsAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"

    def get(self, request):
        query_serializer = DashboardAlertsQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        limit = query_serializer.validated_data["limit"]

        payload = build_dashboard_alerts(limit)
        serializer = DashboardAlertsSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReportsSummaryAPIView(PermissionMixin, APIView):
    permission_classes = [IsAuthenticated]
    permission_module = "reports"

    def get(self, request):
        payload = {
            "active_members_count": build_active_members_count(),
            "total_unpaid_balance": build_total_unpaid_members_balance(),
            "current_month_expenses": build_current_month_expense_total(),
        }
        return Response(payload, status=status.HTTP_200_OK)
