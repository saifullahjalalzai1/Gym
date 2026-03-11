from datetime import date

from rest_framework import serializers

from .models import Staff, Trainer


class StaffBaseSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    def get_age(self, obj: Staff):
        if not obj.date_of_birth:
            return None

        today = date.today()
        return today.year - obj.date_of_birth.year - (
            (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
        )

    def get_profile_picture_url(self, obj: Staff):
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return obj.profile_picture.url


class StaffListSerializer(StaffBaseSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "staff_code",
            "position",
            "position_other",
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
            "age",
            "created_at",
        ]


class StaffDetailSerializer(StaffBaseSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "staff_code",
            "position",
            "position_other",
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
            "notes",
            "created_at",
            "updated_at",
        ]


class StaffWriteSerializer(StaffBaseSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "staff_code",
            "position",
            "position_other",
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
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "staff_code",
            "age",
            "profile_picture_url",
            "created_at",
            "updated_at",
        ]

    def _sync_trainer_profile(self, staff: Staff):
        if staff.position == "trainer":
            Trainer.objects.get_or_create(staff=staff)
            return
        Trainer.objects.filter(staff=staff).delete()

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

        position = attrs.get("position")
        if self.instance is not None and "position" not in attrs:
            position = self.instance.position

        position_other = attrs.get("position_other")
        if self.instance is not None and "position_other" not in attrs:
            position_other = self.instance.position_other

        if position == "other":
            if not position_other or not str(position_other).strip():
                raise serializers.ValidationError(
                    {"position_other": "Position details are required when position is 'other'."}
                )
            attrs["position_other"] = str(position_other).strip()
        elif "position_other" in attrs or position_other:
            attrs["position_other"] = None

        return attrs

    def create(self, validated_data):
        staff = super().create(validated_data)
        self._sync_trainer_profile(staff)
        return staff

    def update(self, instance, validated_data):
        staff = super().update(instance, validated_data)
        self._sync_trainer_profile(staff)
        return staff
