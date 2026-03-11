from __future__ import annotations

from decimal import Decimal

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import ActivityLog, ROLE_CHOICES, RolePermission, User
from core.models import Permission

from .models import (
    BackupJob,
    BackupScheduleSettings,
    BillingSettings,
    GymProfileSettings,
    MembershipPlanTemplate,
    NotificationSettings,
    SecuritySettings,
    SystemPreferenceSettings,
)

ROLE_ALIAS_TO_CANONICAL = {
    "receptionist": "manager",
    "viewer": "staff",
}
CANONICAL_TO_COMPAT = {
    "manager": "receptionist",
    "staff": "viewer",
}
VALID_CANONICAL_ROLES = {"admin", "manager", "staff"}


def normalize_role_name(role_name: str) -> str:
    role_name = (role_name or "").strip().lower()
    return ROLE_ALIAS_TO_CANONICAL.get(role_name, role_name)


def role_name_for_storage(role_name: str) -> str:
    canonical = normalize_role_name(role_name)
    return CANONICAL_TO_COMPAT.get(canonical, canonical)


def role_name_for_response(role_name: str) -> str:
    return normalize_role_name(role_name)


class GymProfileSettingsSerializer(serializers.ModelSerializer):
    gym_logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = GymProfileSettings
        fields = [
            "gym_name",
            "gym_logo",
            "gym_logo_url",
            "address",
            "phone_number",
            "email",
            "website",
            "working_hours_json",
            "description",
        ]
        extra_kwargs = {
            "gym_logo": {"write_only": True, "required": False, "allow_null": True}
        }

    def get_gym_logo_url(self, obj):
        if not obj.gym_logo:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.gym_logo.url)
        return obj.gym_logo.url


class MembershipPlanTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlanTemplate
        fields = [
            "id",
            "name",
            "duration_type",
            "duration_months",
            "fee",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_fee(self, value):
        if value <= 0:
            raise serializers.ValidationError("Plan fee must be greater than 0.")
        return value


class BillingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingSettings
        fields = [
            "default_currency",
            "payment_methods_json",
            "default_tax_percentage",
            "discount_mode",
            "discount_value",
            "invoice_prefix",
            "invoice_padding",
            "invoice_next_sequence",
        ]

    def validate_default_currency(self, value):
        if value != "AFN":
            raise serializers.ValidationError("Only AFN currency is supported in phase 1.")
        return value

    def validate_discount_value(self, value):
        if value < 0:
            raise serializers.ValidationError("Discount value cannot be negative.")
        return value

    def validate_payment_methods_json(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("payment_methods_json must be a list.")
        supported = {"cash", "bank_transfer", "online"}
        invalid = [item for item in value if item not in supported]
        if invalid:
            raise serializers.ValidationError(f"Unsupported payment methods: {', '.join(invalid)}")
        return value


class NotificationSettingsSerializer(serializers.ModelSerializer):
    smtp_password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    sms_api_key = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = NotificationSettings
        fields = [
            "membership_expiry_alert_enabled",
            "membership_expiry_days_before",
            "payment_due_reminder_enabled",
            "payment_due_days_before",
            "sms_enabled",
            "sms_provider",
            "sms_sender_id",
            "sms_api_key",
            "email_enabled",
            "smtp_host",
            "smtp_port",
            "smtp_username",
            "smtp_password",
            "from_email",
        ]

    def update(self, instance, validated_data):
        smtp_password = validated_data.pop("smtp_password", None)
        sms_api_key = validated_data.pop("sms_api_key", None)
        if smtp_password not in [None, ""]:
            instance.smtp_password_encrypted = smtp_password
        if sms_api_key not in [None, ""]:
            instance.sms_api_key_encrypted = sms_api_key
        return super().update(instance, validated_data)


class SecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecuritySettings
        fields = [
            "min_password_length",
            "require_uppercase",
            "require_lowercase",
            "require_number",
            "require_special",
            "two_factor_enabled",
            "login_attempt_limit",
            "lockout_minutes",
        ]


class SystemPreferenceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPreferenceSettings
        fields = ["language", "date_format", "time_format", "timezone"]


class BackupScheduleSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupScheduleSettings
        fields = [
            "enabled",
            "frequency",
            "run_time",
            "weekday",
            "retention_count",
            "backup_directory",
        ]


class BackupJobSerializer(serializers.ModelSerializer):
    triggered_by_username = serializers.CharField(source="triggered_by.username", read_only=True)

    class Meta:
        model = BackupJob
        fields = [
            "id",
            "job_type",
            "status",
            "file_path",
            "file_size_bytes",
            "started_at",
            "completed_at",
            "triggered_by",
            "triggered_by_username",
            "error_message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class SettingsUserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "username",
            "email",
            "phone",
            "role_name",
            "is_active",
            "last_login",
            "created_at",
        ]
        read_only_fields = ["id", "last_login", "created_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["role_name"] = role_name_for_response(data["role_name"])
        return data

    def validate_role_name(self, value):
        canonical = normalize_role_name(value)
        if canonical not in VALID_CANONICAL_ROLES:
            raise serializers.ValidationError("Role must be one of admin, manager, or staff.")
        return canonical

    def create(self, validated_data):
        request = self.context.get("request")
        role_name = validated_data.pop("role_name")
        password = validated_data.pop("password")

        if role_name == "admin" and request and not request.user.is_superuser:
            raise serializers.ValidationError({"role_name": "Only superusers can create admin users."})

        user = User.objects.create_user(
            role_name=role_name_for_storage(role_name),
            password=password,
            **validated_data,
        )
        return user

    def update(self, instance, validated_data):
        role_name = validated_data.pop("role_name", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if role_name is not None:
            instance.role_name = role_name_for_storage(role_name)
        instance.save()
        return instance


class SettingsUserCreateSerializer(SettingsUserSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta(SettingsUserSerializer.Meta):
        fields = SettingsUserSerializer.Meta.fields + ["password"]


class ChangeManagedUserPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(validators=[validate_password])


class PermissionAssignmentSerializer(serializers.Serializer):
    module = serializers.CharField()
    actions = serializers.ListField(
        child=serializers.ChoiceField(choices=["view", "add", "change", "delete", "all"])
    )


class RolePermissionsUpdateSerializer(serializers.Serializer):
    role_name = serializers.CharField()
    permissions = PermissionAssignmentSerializer(many=True)

    def validate_role_name(self, value):
        canonical = normalize_role_name(value)
        if canonical not in VALID_CANONICAL_ROLES:
            raise serializers.ValidationError("Invalid role name.")
        return canonical


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "action",
            "table_name",
            "record_id",
            "old_values",
            "new_values",
            "ip_address",
            "user_agent",
            "timestamp",
            "user_name",
        ]

    def get_user_name(self, obj):
        full = obj.user.get_full_name().strip()
        return full or obj.user.username


class InvoicePreviewSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal("0.00"))


class RestoreBackupSerializer(serializers.Serializer):
    confirm = serializers.BooleanField()

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError("confirm must be true to restore backup.")
        return value


def get_available_roles_payload():
    role_codes = {choice[0] for choice in ROLE_CHOICES}
    canonical_roles = ["admin", "manager", "staff"]
    items = []
    for role in canonical_roles:
        storage_role = role_name_for_storage(role)
        if storage_role in role_codes:
            items.append({"name": role, "storage_role": storage_role})
    return items


def get_role_permissions_matrix(role_name: str):
    storage_role = role_name_for_storage(role_name)
    role_permissions = (
        RolePermission.objects.filter(role_name=storage_role)
        .select_related("permission")
        .order_by("permission__module", "permission__action")
    )
    modules = {}
    for entry in role_permissions:
        modules.setdefault(entry.permission.module, []).append(entry.permission.action)

    return [{"module": module, "actions": sorted(actions)} for module, actions in modules.items()]


def update_role_permissions_matrix(role_name: str, assignments: list[dict]):
    storage_role = role_name_for_storage(role_name)

    RolePermission.objects.filter(role_name=storage_role, permission__module="settings").delete()

    for item in assignments:
        module = item["module"]
        actions = set(item["actions"])

        permissions = Permission.objects.filter(module=module, action__in=actions)
        for permission in permissions:
            RolePermission.objects.get_or_create(role_name=storage_role, permission=permission)
