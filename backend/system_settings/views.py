from __future__ import annotations

from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import ActivityLog, RolePermission, User
from core.models import Permission
from core.pagination import StandardResultsSetPagination

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
from .permissions import require_settings_admin, require_settings_permission
from .serializers import (
    ActivityLogSerializer,
    BackupJobSerializer,
    BackupScheduleSettingsSerializer,
    BillingSettingsSerializer,
    ChangeManagedUserPasswordSerializer,
    GymProfileSettingsSerializer,
    InvoicePreviewSerializer,
    MembershipPlanTemplateSerializer,
    NotificationSettingsSerializer,
    RestoreBackupSerializer,
    RolePermissionsUpdateSerializer,
    SecuritySettingsSerializer,
    SettingsUserCreateSerializer,
    SettingsUserSerializer,
    SystemPreferenceSettingsSerializer,
    get_available_roles_payload,
    get_role_permissions_matrix,
    normalize_role_name,
    role_name_for_storage,
)
from .services import create_manual_sqlite_backup, get_system_logs, restore_sqlite_backup


class GymProfileSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        settings_obj = GymProfileSettings.get_solo()
        serializer = GymProfileSettingsSerializer(settings_obj, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        require_settings_permission(request, "change")
        settings_obj = GymProfileSettings.get_solo()
        serializer = GymProfileSettingsSerializer(
            settings_obj,
            data=request.data,
            partial=False,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class GymLogoAPIView(APIView):
    permission_classes = [IsAuthenticated]
    allowed_logo_content_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    max_logo_size_bytes = 2 * 1024 * 1024

    def post(self, request):
        require_settings_permission(request, "change")
        settings_obj = GymProfileSettings.get_solo()
        file = request.FILES.get("gym_logo") or request.FILES.get("logo")
        if not file:
            return Response({"detail": "No logo file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        if file.content_type not in self.allowed_logo_content_types:
            return Response(
                {"detail": "Invalid logo file type. Allowed types: JPEG, PNG, WEBP."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if file.size > self.max_logo_size_bytes:
            return Response(
                {"detail": "Logo size must be 2MB or less."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings_obj.gym_logo = file
        settings_obj.save(update_fields=["gym_logo", "updated_at"])
        serializer = GymProfileSettingsSerializer(settings_obj, context={"request": request})
        return Response(serializer.data)

    def delete(self, request):
        require_settings_permission(request, "change")
        settings_obj = GymProfileSettings.get_solo()
        if settings_obj.gym_logo:
            settings_obj.gym_logo.delete(save=False)
        settings_obj.gym_logo = None
        settings_obj.save(update_fields=["gym_logo", "updated_at"])
        serializer = GymProfileSettingsSerializer(settings_obj, context={"request": request})
        return Response(serializer.data)


class SettingsUsersViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all().order_by("-created_at")
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["first_name", "last_name", "username", "email", "phone"]
    ordering_fields = ["created_at", "username", "first_name", "last_name"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        role_param = self.request.query_params.get("role")
        if role_param:
            normalized = normalize_role_name(role_param)
            queryset = queryset.filter(role_name=role_name_for_storage(normalized))
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return SettingsUserCreateSerializer
        return SettingsUserSerializer

    def list(self, request, *args, **kwargs):
        require_settings_permission(request, "view")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        require_settings_permission(request, "view")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        require_settings_permission(request, "add")
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        require_settings_permission(request, "change")
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="disable")
    def disable(self, request, pk=None):
        require_settings_permission(request, "change")
        user = self.get_object()
        if user.id == request.user.id:
            return Response({"detail": "You cannot disable your own account."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"detail": "User disabled successfully."})

    @action(detail=True, methods=["post"], url_path="enable")
    def enable(self, request, pk=None):
        require_settings_permission(request, "change")
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response({"detail": "User enabled successfully."})

    @action(detail=True, methods=["post"], url_path="change-password")
    def change_password(self, request, pk=None):
        require_settings_permission(request, "change")
        user = self.get_object()
        serializer = ChangeManagedUserPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password changed successfully."})


class RolesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        payload = []
        for role in get_available_roles_payload():
            payload.append(
                {
                    "name": role["name"],
                    "permissions": get_role_permissions_matrix(role["name"]),
                }
            )
        return Response(payload)


class RolePermissionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, role_name):
        require_settings_permission(request, "change")
        serializer = RolePermissionsUpdateSerializer(
            data={
                "role_name": role_name,
                "permissions": request.data.get("permissions", []),
            }
        )
        serializer.is_valid(raise_exception=True)

        normalized_role = serializer.validated_data["role_name"]
        assignments = serializer.validated_data["permissions"]

        storage_role = role_name_for_storage(normalized_role)

        with transaction.atomic():
            RolePermission.objects.filter(role_name=storage_role).delete()
            for assignment in assignments:
                module = assignment["module"]
                for action_name in set(assignment["actions"]):
                    permission = Permission.objects.filter(module=module, action=action_name).first()
                    if permission:
                        RolePermission.objects.get_or_create(
                            role_name=storage_role,
                            permission=permission,
                        )

        return Response(
            {
                "name": normalized_role,
                "permissions": get_role_permissions_matrix(normalized_role),
            }
        )


class ModulesActionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        modules = []
        default_actions = ["view", "add", "change", "delete"]

        for module, label in Permission.MODULES:
            actions = list(
                Permission.objects.filter(module=module)
                .values_list("action", flat=True)
                .distinct()
            )
            if not actions:
                actions = default_actions
            modules.append(
                {
                    "module": module,
                    "label": label,
                    "actions": sorted(actions),
                }
            )

        return Response(modules)


class MembershipPlanTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = MembershipPlanTemplate.objects.order_by("name", "duration_months")
    serializer_class = MembershipPlanTemplateSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["duration_type", "is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "fee", "duration_months", "created_at"]
    ordering = ["name"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def list(self, request, *args, **kwargs):
        require_settings_permission(request, "view")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        require_settings_permission(request, "view")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        require_settings_permission(request, "add")
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        require_settings_permission(request, "change")
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        require_settings_permission(request, "change")
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        require_settings_permission(request, "change")
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(instance).data)


class BillingSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        settings_obj = BillingSettings.get_solo()
        serializer = BillingSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        require_settings_permission(request, "change")
        settings_obj = BillingSettings.get_solo()
        serializer = BillingSettingsSerializer(settings_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class InvoiceSequencePreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        require_settings_permission(request, "view")
        serializer = InvoicePreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        settings_obj = BillingSettings.get_solo()
        next_seq = str(settings_obj.invoice_next_sequence).zfill(settings_obj.invoice_padding)
        invoice_number = f"{settings_obj.invoice_prefix}-{next_seq}"

        return Response(
            {
                "invoice_number": invoice_number,
                "next_sequence": settings_obj.invoice_next_sequence,
                "currency": settings_obj.default_currency,
            }
        )


class NotificationSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        settings_obj = NotificationSettings.get_solo()
        serializer = NotificationSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        require_settings_permission(request, "change")
        settings_obj = NotificationSettings.get_solo()
        serializer = NotificationSettingsSerializer(settings_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class NotificationTestEmailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        require_settings_permission(request, "change")
        settings_obj = NotificationSettings.get_solo()

        if not settings_obj.email_enabled:
            return Response({"success": False, "detail": "Email notifications are disabled."}, status=400)
        if not settings_obj.smtp_host or not settings_obj.from_email:
            return Response({"success": False, "detail": "Email configuration is incomplete."}, status=400)

        return Response({"success": True, "detail": "Email configuration looks valid."})


class NotificationTestSMSAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        require_settings_permission(request, "change")
        settings_obj = NotificationSettings.get_solo()

        if not settings_obj.sms_enabled:
            return Response({"success": False, "detail": "SMS notifications are disabled."}, status=400)
        if not settings_obj.sms_provider or not settings_obj.sms_api_key_encrypted:
            return Response({"success": False, "detail": "SMS configuration is incomplete."}, status=400)

        return Response({"success": True, "detail": "SMS configuration looks valid."})


class SecuritySettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        settings_obj = SecuritySettings.get_solo()
        serializer = SecuritySettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        require_settings_permission(request, "change")
        settings_obj = SecuritySettings.get_solo()
        serializer = SecuritySettingsSerializer(settings_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SecurityActivityLogsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        queryset = ActivityLog.objects.select_related("user").order_by("-timestamp")

        action_value = request.query_params.get("action")
        user_value = request.query_params.get("user")
        if action_value:
            queryset = queryset.filter(action=action_value)
        if user_value:
            queryset = queryset.filter(user__username__icontains=user_value)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = ActivityLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class SystemPreferenceSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        settings_obj = SystemPreferenceSettings.get_solo()
        serializer = SystemPreferenceSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        require_settings_permission(request, "change")
        settings_obj = SystemPreferenceSettings.get_solo()
        serializer = SystemPreferenceSettingsSerializer(settings_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class BackupManualAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        require_settings_permission(request, "change")
        require_settings_admin(request)
        try:
            backup_job = create_manual_sqlite_backup(triggered_by=request.user)
            return Response(BackupJobSerializer(backup_job).data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class BackupJobsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        queryset = BackupJob.objects.all().order_by("-created_at")
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = BackupJobSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class BackupRestoreAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):
        require_settings_permission(request, "change")
        require_settings_admin(request)
        serializer = RestoreBackupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_job = BackupJob.objects.filter(pk=job_id).first()
        if not source_job:
            return Response({"detail": "Backup job not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            restored_job = restore_sqlite_backup(backup_job=source_job, triggered_by=request.user)
            return Response(BackupJobSerializer(restored_job).data, status=status.HTTP_201_CREATED)
        except FileNotFoundError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class BackupScheduleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        settings_obj = BackupScheduleSettings.get_solo()
        serializer = BackupScheduleSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def put(self, request):
        require_settings_permission(request, "change")
        settings_obj = BackupScheduleSettings.get_solo()
        serializer = BackupScheduleSettingsSerializer(settings_obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SystemLogsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        require_settings_permission(request, "view")
        limit = int(request.query_params.get("limit", 200))
        limit = max(1, min(limit, 1000))
        logs = get_system_logs(limit=limit)
        serializer = ActivityLogSerializer(logs, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data, "generated_at": timezone.now()})
