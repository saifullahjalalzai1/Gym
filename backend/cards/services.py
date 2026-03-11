from datetime import timedelta

from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from members.models import Member
from payments.models import MemberFeeCycle
from staff.models import Staff

from .models import Card, CardSequence


class CardAlreadyExistsError(Exception):
    pass


class CardNotFoundError(Exception):
    pass


def _resolve_holder(holder_type: str, holder_id: int):
    if holder_type == Card.HOLDER_TYPE_MEMBER:
        return Member.objects.filter(pk=holder_id).first(), {'member_id': holder_id}
    if holder_type == Card.HOLDER_TYPE_STAFF:
        return Staff.objects.filter(pk=holder_id).first(), {'staff_id': holder_id}
    raise ValueError('Invalid holder_type.')


def _next_holder_version(holder_filter: dict) -> int:
    latest = (
        Card.all_objects.filter(**holder_filter)
        .aggregate(max_version=Max('version'))
        .get('max_version')
    )
    return (latest or 0) + 1


def generate_next_card_id(holder_type: str) -> str:
    prefix_map = {
        Card.HOLDER_TYPE_MEMBER: 'MCD',
        Card.HOLDER_TYPE_STAFF: 'SCD',
    }
    prefix = prefix_map.get(holder_type)
    if not prefix:
        raise ValueError('Invalid holder_type.')

    with transaction.atomic():
        sequence, _ = CardSequence.objects.select_for_update().get_or_create(
            holder_type=holder_type,
            defaults={'last_number': 0},
        )
        sequence.last_number += 1
        sequence.save(update_fields=['last_number'])
        return f'{prefix}-{sequence.last_number:06d}'


def get_current_card(holder_type: str, holder_id: int) -> Card | None:
    _, holder_filter = _resolve_holder(holder_type=holder_type, holder_id=holder_id)
    return (
        Card.objects.select_related('member', 'staff', 'generated_by', 'replaced_by')
        .filter(is_current=True, **holder_filter)
        .first()
    )


def list_card_history(holder_type: str, holder_id: int):
    _, holder_filter = _resolve_holder(holder_type=holder_type, holder_id=holder_id)
    return (
        Card.objects.select_related('member', 'staff', 'generated_by', 'replaced_by')
        .filter(**holder_filter)
        .order_by('-version', '-created_at')
    )


def create_initial_card(holder_type: str, holder_id: int, user=None) -> Card:
    holder, holder_filter = _resolve_holder(holder_type=holder_type, holder_id=holder_id)
    if holder is None:
        raise CardNotFoundError('Holder not found.')

    with transaction.atomic():
        current_exists = Card.objects.select_for_update().filter(
            is_current=True, **holder_filter
        ).exists()
        if current_exists:
            raise CardAlreadyExistsError('Current card already exists.')

        version = _next_holder_version(holder_filter=holder_filter)
        card_id = generate_next_card_id(holder_type=holder_type)

        card_payload = {
            'card_id': card_id,
            'holder_type': holder_type,
            'version': version,
            'is_current': True,
            'qr_value': card_id,
            'barcode_value': card_id,
            'generated_by': user,
        }
        card_payload.update(holder_filter)
        return Card.objects.create(**card_payload)


def regenerate_card(holder_type: str, holder_id: int, user=None, reason: str | None = None) -> Card:
    holder, holder_filter = _resolve_holder(holder_type=holder_type, holder_id=holder_id)
    if holder is None:
        raise CardNotFoundError('Holder not found.')

    with transaction.atomic():
        current_card = (
            Card.objects.select_for_update()
            .filter(is_current=True, **holder_filter)
            .first()
        )
        if current_card is None:
            raise CardNotFoundError('Current card not found.')

        current_card.is_current = False
        current_card.replaced_at = timezone.now()
        current_card.save(update_fields=['is_current', 'replaced_at', 'updated_at'])

        card_id = generate_next_card_id(holder_type=holder_type)
        version = _next_holder_version(holder_filter=holder_filter)

        new_card_payload = {
            'card_id': card_id,
            'holder_type': holder_type,
            'version': version,
            'is_current': True,
            'qr_value': card_id,
            'barcode_value': card_id,
            'generated_by': user,
            'regenerate_reason': reason.strip() if reason else None,
        }
        new_card_payload.update(holder_filter)
        new_card = Card.objects.create(**new_card_payload)

        current_card.replaced_by = new_card
        current_card.save(update_fields=['replaced_by', 'updated_at'])

        return new_card


def build_member_validity(member_id: int):
    latest_paid_cycle = (
        MemberFeeCycle.objects.filter(member_id=member_id, status='paid')
        .order_by('-cycle_month')
        .first()
    )
    if latest_paid_cycle is None:
        return None, None

    valid_from = latest_paid_cycle.cycle_month.replace(day=1)
    next_month = (valid_from.replace(day=28) + timedelta(days=4)).replace(day=1)
    valid_to = next_month - timedelta(days=1)
    return valid_from, valid_to


def compute_member_card_status(member: Member, valid_to):
    today = timezone.localdate()
    if member.status == 'active' and valid_to is not None and today <= valid_to:
        return 'active'
    return 'expired'


def can_user_view_holder(user, holder_type: str) -> bool:
    if user.is_superuser:
        return True

    from core.permissions import _user_has_permission

    if holder_type == Card.HOLDER_TYPE_MEMBER:
        module = 'members'
    elif holder_type == Card.HOLDER_TYPE_STAFF:
        module = 'staff'
    else:
        return False
    return _user_has_permission(user, module, 'view') or _user_has_permission(user, module, 'all')


def lookup_card_by_id(card_id: str) -> Card | None:
    return (
        Card.objects.select_related('member', 'staff', 'generated_by', 'replaced_by')
        .filter(card_id=card_id)
        .first()
    )
