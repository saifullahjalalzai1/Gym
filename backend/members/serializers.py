from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers

from .models import Member


class MemberBMIModelSerializer(serializers.ModelSerializer):
    bmi = serializers.SerializerMethodField()
    bmi_category = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    def _compute_bmi(self, obj: Member):
        if obj.height_cm is None or obj.weight_kg is None:
            return None

        if obj.height_cm <= 0 or obj.weight_kg <= 0:
            return None

        height_m = Decimal(obj.height_cm) / Decimal("100")
        bmi_value = Decimal(obj.weight_kg) / (height_m * height_m)
        return bmi_value.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)

    def get_bmi(self, obj: Member):
        bmi_value = self._compute_bmi(obj)
        return float(bmi_value) if bmi_value is not None else None

    def get_bmi_category(self, obj: Member):
        bmi_value = self._compute_bmi(obj)
        if bmi_value is None:
            return None
        if bmi_value < Decimal("18.5"):
            return "underweight"
        if bmi_value < Decimal("25"):
            return "normal"
        if bmi_value < Decimal("30"):
            return "overweight"
        return "obese"

    def get_profile_picture_url(self, obj: Member):
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.profile_picture.url)
        return obj.profile_picture.url


class MemberListSerializer(MemberBMIModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "member_code",
            "id_card_number",
            "first_name",
            "last_name",
            "phone",
            "email",
            "blood_group",
            "profile_picture",
            "profile_picture_url",
            "join_date",
            "status",
            "height_cm",
            "weight_kg",
            "bmi",
            "bmi_category",
            "created_at",
        ]


class MemberDetailSerializer(MemberBMIModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "member_code",
            "id_card_number",
            "first_name",
            "last_name",
            "phone",
            "email",
            "blood_group",
            "profile_picture",
            "profile_picture_url",
            "date_of_birth",
            "gender",
            "emergency_contact_name",
            "emergency_contact_phone",
            "height_cm",
            "weight_kg",
            "bmi",
            "bmi_category",
            "join_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]


class MemberWriteSerializer(MemberBMIModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "member_code",
            "id_card_number",
            "first_name",
            "last_name",
            "phone",
            "email",
            "blood_group",
            "profile_picture",
            "profile_picture_url",
            "date_of_birth",
            "gender",
            "emergency_contact_name",
            "emergency_contact_phone",
            "height_cm",
            "weight_kg",
            "bmi",
            "bmi_category",
            "join_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "member_code",
            "bmi",
            "bmi_category",
            "profile_picture_url",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        height_cm = attrs.get("height_cm")
        weight_kg = attrs.get("weight_kg")

        if self.instance is not None:
            if "height_cm" not in attrs:
                height_cm = self.instance.height_cm
            if "weight_kg" not in attrs:
                weight_kg = self.instance.weight_kg

        if height_cm is not None and height_cm <= 0:
            raise serializers.ValidationError({"height_cm": "Height must be greater than 0."})

        if weight_kg is not None and weight_kg <= 0:
            raise serializers.ValidationError({"weight_kg": "Weight must be greater than 0."})

        has_height = height_cm is not None
        has_weight = weight_kg is not None
        if has_height != has_weight:
            raise serializers.ValidationError(
                "Height and weight must both be provided to compute BMI."
            )

        return attrs
