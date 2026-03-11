import json
from datetime import date

from rest_framework import serializers

from .models import Trainer


class TrainerBaseSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    def get_age(self, obj: Trainer):
        if not obj.date_of_birth:
            return None

        today = date.today()
        return today.year - obj.date_of_birth.year - (
            (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
        )

    def get_profile_picture_url(self, obj: Trainer):
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return obj.profile_picture.url


class TrainerListSerializer(TrainerBaseSerializer):
    class Meta:
        model = Trainer
        fields = [
            "id",
            "trainer_code",
            "first_name",
            "last_name",
            "mobile_number",
            "email",
            "date_hired",
            "monthly_salary",
            "salary_currency",
            "salary_status",
            "employment_status",
            "profile_picture",
            "profile_picture_url",
            "assigned_classes",
            "age",
            "created_at",
        ]


class TrainerDetailSerializer(TrainerBaseSerializer):
    class Meta:
        model = Trainer
        fields = [
            "id",
            "trainer_code",
            "id_card_number",
            "first_name",
            "last_name",
            "father_name",
            "mobile_number",
            "whatsapp_number",
            "email",
            "blood_group",
            "profile_picture",
            "profile_picture_url",
            "date_of_birth",
            "age",
            "date_hired",
            "monthly_salary",
            "salary_currency",
            "salary_status",
            "employment_status",
            "assigned_classes",
            "notes",
            "created_at",
            "updated_at",
        ]


class TrainerWriteSerializer(TrainerBaseSerializer):
    class Meta:
        model = Trainer
        fields = [
            "id",
            "trainer_code",
            "id_card_number",
            "first_name",
            "last_name",
            "father_name",
            "mobile_number",
            "whatsapp_number",
            "email",
            "blood_group",
            "profile_picture",
            "profile_picture_url",
            "date_of_birth",
            "age",
            "date_hired",
            "monthly_salary",
            "salary_currency",
            "salary_status",
            "employment_status",
            "assigned_classes",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "trainer_code",
            "age",
            "profile_picture_url",
            "created_at",
            "updated_at",
        ]

    def _normalize_assigned_classes(self, value):
        if value is None:
            return []

        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            try:
                value = json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError(
                    {"assigned_classes": "Assigned classes must be a JSON array of strings."}
                ) from exc

        if not isinstance(value, list):
            raise serializers.ValidationError(
                {"assigned_classes": "Assigned classes must be an array of strings."}
            )

        normalized = []
        seen = set()
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError(
                    {"assigned_classes": "Each assigned class must be a string."}
                )
            cleaned = item.strip()
            if not cleaned:
                raise serializers.ValidationError(
                    {"assigned_classes": "Assigned class names cannot be empty."}
                )
            lowered = cleaned.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            normalized.append(cleaned)
        return normalized

    def validate(self, attrs):
        today = date.today()

        monthly_salary = attrs.get("monthly_salary")
        if self.instance is not None and "monthly_salary" not in attrs:
            monthly_salary = self.instance.monthly_salary
        if monthly_salary is not None and monthly_salary <= 0:
            raise serializers.ValidationError({"monthly_salary": "Monthly salary must be greater than 0."})

        date_of_birth = attrs.get("date_of_birth")
        if self.instance is not None and "date_of_birth" not in attrs:
            date_of_birth = self.instance.date_of_birth
        if date_of_birth and date_of_birth > today:
            raise serializers.ValidationError({"date_of_birth": "Date of birth cannot be in the future."})

        date_hired = attrs.get("date_hired")
        if self.instance is not None and "date_hired" not in attrs:
            date_hired = self.instance.date_hired
        if date_hired and date_hired > today:
            raise serializers.ValidationError({"date_hired": "Date hired cannot be in the future."})

        if "assigned_classes" in attrs:
            attrs["assigned_classes"] = self._normalize_assigned_classes(attrs.get("assigned_classes"))

        return attrs
