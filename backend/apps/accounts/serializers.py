from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import BusinessProfile, ForwarderProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=160)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    role = serializers.ChoiceField(choices=User.Role.choices)
    consent = serializers.BooleanField()

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Bu email allaqachon ro'yxatdan o'tgan")
        return email

    def validate_consent(self, value):
        if not value:
            raise serializers.ValidationError("Rozilik majburiy")
        return value

    def create(self, validated):
        user = User.objects.create_user(
            email=validated["email"],
            password=validated["password"],
            full_name=(validated.get("full_name") or "").strip(),
            phone=(validated.get("phone") or "").strip(),
            role=validated["role"],
            consent_at=timezone.now(),
        )
        if user.role == User.Role.BUSINESS:
            BusinessProfile.objects.create(
                user=user,
                business_name=user.full_name or "",
            )
        else:
            ForwarderProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = ("business_name", "region", "activity", "market")


class ForwarderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForwarderProfile
        fields = ("vehicle", "capacity", "region")


class MeSerializer(serializers.ModelSerializer):
    business = BusinessProfileSerializer(source="business_profile", required=False)
    forwarder = ForwarderProfileSerializer(source="forwarder_profile", required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "business",
            "forwarder",
        )
        read_only_fields = ("id", "email", "role")

    def update(self, instance, validated):
        instance.full_name = validated.get("full_name", instance.full_name)
        instance.phone = validated.get("phone", instance.phone)
        instance.save(update_fields=["full_name", "phone"])

        biz_data = validated.get("business_profile")
        fwd_data = validated.get("forwarder_profile")

        if instance.role == User.Role.BUSINESS and biz_data is not None:
            profile, _ = BusinessProfile.objects.get_or_create(user=instance)
            for k, v in biz_data.items():
                setattr(profile, k, v)
            profile.save()
        if instance.role == User.Role.FORWARDER and fwd_data is not None:
            profile, _ = ForwarderProfile.objects.get_or_create(user=instance)
            for k, v in fwd_data.items():
                setattr(profile, k, v)
            profile.save()
        return instance
