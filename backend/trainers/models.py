from datetime import date

from django.db import models

from core.base_models import BaseModel


class Trainer(BaseModel):
    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
        ("O+", "O+"),
        ("O-", "O-"),
    ]

    EMPLOYMENT_STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("on_leave", "On Leave"),
        ("resigned", "Resigned"),
    ]

    SALARY_STATUS_CHOICES = [
        ("paid", "Paid"),
        ("unpaid", "Unpaid"),
        ("partial", "Partial"),
    ]

    trainer_code = models.CharField(max_length=10, unique=True, db_index=True, editable=False)
    id_card_number = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=120, blank=True, null=True)
    mobile_number = models.CharField(max_length=20)
    whatsapp_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    profile_picture = models.ImageField(upload_to="trainers/profile_pictures/", blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    date_hired = models.DateField()
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2)
    salary_currency = models.CharField(max_length=10, default="AFN")
    salary_status = models.CharField(max_length=10, choices=SALARY_STATUS_CHOICES, default="unpaid")
    employment_status = models.CharField(
        max_length=10, choices=EMPLOYMENT_STATUS_CHOICES, default="active"
    )
    assigned_classes = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "trainers"
        indexes = [
            models.Index(fields=["trainer_code"], name="trainers_code_idx"),
            models.Index(fields=["employment_status"], name="trainers_emp_status_idx"),
            models.Index(fields=["salary_status"], name="trainers_sal_status_idx"),
            models.Index(fields=["mobile_number"], name="trainers_mobile_idx"),
            models.Index(fields=["last_name"], name="trainers_last_name_idx"),
            models.Index(fields=["date_hired"], name="trainers_hired_idx"),
            models.Index(fields=["created_at"], name="trainers_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.trainer_code} - {self.first_name} {self.last_name}"

    @classmethod
    def generate_trainer_code(cls) -> str:
        latest_code = (
            cls.all_objects.filter(trainer_code__startswith="TRN-")
            .order_by("-trainer_code")
            .values_list("trainer_code", flat=True)
            .first()
        )

        next_number = 1
        if latest_code:
            try:
                next_number = int(latest_code.split("-")[1]) + 1
            except (IndexError, ValueError):
                next_number = 1

        while True:
            candidate = f"TRN-{next_number:06d}"
            if not cls.all_objects.filter(trainer_code=candidate).exists():
                return candidate
            next_number += 1

    def save(self, *args, **kwargs):
        if not self.trainer_code:
            self.trainer_code = self.generate_trainer_code()
        super().save(*args, **kwargs)
