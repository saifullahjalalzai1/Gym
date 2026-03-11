from __future__ import annotations

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import RolePermission, User
from core.models import Permission

from .models import BackupJob


class SettingsEndpointsTests(APITestCase):
    def setUp(self):
        self._seed_permissions()

        self.admin_user = User.objects.create_user(
            username="admin_user",
            password="AdminPass123!",
            role_name="admin",
            email="admin@example.com",
        )
        self.manager_user = User.objects.create_user(
            username="manager_user",
            password="ManagerPass123!",
            role_name="manager",
            email="manager@example.com",
        )
        self.staff_user = User.objects.create_user(
            username="staff_user",
            password="StaffPass123!",
            role_name="staff",
            email="staff@example.com",
        )
        self.other_user = User.objects.create_user(
            username="another_user",
            password="AnotherPass123!",
            role_name="staff",
            email="another@example.com",
        )

    def _seed_permissions(self):
        action_map = {
            "admin": ("view", "add", "change", "delete"),
            "manager": ("view", "add", "change"),
            "staff": ("view",),
        }

        for role_name, actions in action_map.items():
            for action in actions:
                permission, _ = Permission.objects.get_or_create(
                    module="settings",
                    action=action,
                    defaults={"description": f"Can {action} settings"},
                )
                RolePermission.objects.get_or_create(role_name=role_name, permission=permission)

    def test_user_cannot_disable_self(self):
        self.client.force_authenticate(self.manager_user)

        url = f"/api/settings/users/{self.manager_user.id}/disable/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot disable your own account", response.data.get("detail", "").lower())

    def test_manager_can_disable_other_user(self):
        self.client.force_authenticate(self.manager_user)

        url = f"/api/settings/users/{self.other_user.id}/disable/"
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.other_user.refresh_from_db()
        self.assertFalse(self.other_user.is_active)

    def test_backup_manual_requires_admin(self):
        self.client.force_authenticate(self.manager_user)

        response = self.client.post("/api/settings/backups/manual/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("system_settings.views.create_manual_sqlite_backup")
    def test_backup_manual_admin_success(self, backup_mock):
        job = BackupJob.objects.create(
            job_type="manual",
            status="success",
            file_path="C:/tmp/test.sqlite3",
            file_size_bytes=1024,
            triggered_by=self.admin_user,
        )
        backup_mock.return_value = job

        self.client.force_authenticate(self.admin_user)
        response = self.client.post("/api/settings/backups/manual/")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["job_type"], "manual")
        backup_mock.assert_called_once()

    def test_logo_upload_rejects_non_image_mime(self):
        self.client.force_authenticate(self.manager_user)

        bad_file = SimpleUploadedFile("logo.txt", b"not-an-image", content_type="text/plain")
        response = self.client.post(
            "/api/settings/gym-profile/logo/",
            {"gym_logo": bad_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalid logo file type", response.data.get("detail", "").lower())

    def test_security_policy_change_applies_to_managed_password_change(self):
        self.client.force_authenticate(self.manager_user)

        update_response = self.client.put(
            "/api/settings/security/",
            {
                "min_password_length": 12,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_number": True,
                "require_special": True,
                "two_factor_enabled": False,
                "login_attempt_limit": 5,
                "lockout_minutes": 30,
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        weak_response = self.client.post(
            f"/api/settings/users/{self.other_user.id}/change-password/",
            {"new_password": "Short1!"},
            format="json",
        )
        self.assertEqual(weak_response.status_code, status.HTTP_400_BAD_REQUEST)
