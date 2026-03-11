from __future__ import annotations

import sqlite3
import shutil
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.db import connections
from django.utils import timezone

from accounts.models import ActivityLog

from .models import BackupJob, BackupScheduleSettings


def _default_backup_dir() -> Path:
    return Path(settings.BASE_DIR) / "backups"


def _resolve_configured_backup_dir() -> Path:
    schedule = BackupScheduleSettings.get_solo()
    configured = (schedule.backup_directory or "").strip()
    if configured:
        return Path(configured)
    return _default_backup_dir()


def resolve_backup_path(job: BackupJob) -> Path:
    return Path(job.file_path).resolve()


def validate_sqlite_backup_file(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError("Backup file does not exist.")

    connection = sqlite3.connect(str(path))
    try:
        result = connection.execute("PRAGMA integrity_check;").fetchone()
    finally:
        connection.close()

    if not result or result[0] != "ok":
        raise ValueError("Backup file integrity check failed.")


def create_manual_sqlite_backup(*, triggered_by=None) -> BackupJob:
    db_name = settings.DATABASES["default"]["NAME"]
    db_path = Path(db_name)

    backup_dir = _resolve_configured_backup_dir()
    backup_dir.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_file = backup_dir / f"gym_backup_{stamp}.sqlite3"

    job = BackupJob.objects.create(
        job_type="manual",
        status="running",
        started_at=timezone.now(),
        triggered_by=triggered_by,
    )

    try:
        shutil.copy2(db_path, target_file)
        file_size = target_file.stat().st_size
        job.file_path = str(target_file)
        job.file_size_bytes = file_size
        job.status = "success"
        job.completed_at = timezone.now()
        job.save(update_fields=["file_path", "file_size_bytes", "status", "completed_at", "updated_at"])
    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)
        job.completed_at = timezone.now()
        job.save(update_fields=["status", "error_message", "completed_at", "updated_at"])
        raise

    return job


def restore_sqlite_backup(*, backup_job: BackupJob, triggered_by=None) -> BackupJob:
    source_path = resolve_backup_path(backup_job)
    db_name = settings.DATABASES["default"]["NAME"]
    db_path = Path(db_name)

    restore_job = BackupJob.objects.create(
        job_type="restore",
        status="running",
        file_path=str(source_path),
        file_size_bytes=source_path.stat().st_size if source_path.exists() else 0,
        started_at=timezone.now(),
        triggered_by=triggered_by,
    )

    try:
        validate_sqlite_backup_file(source_path)
        connections.close_all()
        shutil.copy2(source_path, db_path)
        restore_job.status = "success"
        restore_job.completed_at = timezone.now()
        restore_job.save(update_fields=["status", "completed_at", "updated_at"])
    except Exception as exc:
        restore_job.status = "failed"
        restore_job.error_message = str(exc)
        restore_job.completed_at = timezone.now()
        restore_job.save(update_fields=["status", "error_message", "completed_at", "updated_at"])
        raise

    return restore_job


def get_system_logs(*, limit: int = 200):
    queryset = ActivityLog.objects.select_related("user").order_by("-timestamp")[:limit]
    return queryset
