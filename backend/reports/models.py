from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from core.base_models import BaseModel


class Expense(BaseModel):
    CATEGORY_CHOICES = [
        ("rent", "Rent"),
        ("utilities", "Utilities"),
        ("salary", "Salary"),
        ("equipment", "Equipment"),
        ("maintenance", "Maintenance"),
        ("marketing", "Marketing"),
        ("other", "Other"),
    ]

    expense_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses_created",
    )

    class Meta:
        db_table = "reports_expenses"
        ordering = ["-expense_date", "-id"]
        indexes = [
            models.Index(fields=["expense_date"], name="rep_exp_date_idx"),
            models.Index(fields=["category"], name="rep_exp_cat_idx"),
            models.Index(fields=["created_at"], name="rep_exp_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.expense_name} ({self.amount})"

    def clean(self):
        if self.amount is None or self.amount <= 0:
            raise ValidationError({"amount": "Amount must be greater than 0."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

