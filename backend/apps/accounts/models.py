from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra):
        if not email:
            raise ValueError("Email majburiy")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.BUSINESS)
        if extra.get("is_staff") is not True:
            raise ValueError("Superuser is_staff=True bo'lishi kerak")
        if extra.get("is_superuser") is not True:
            raise ValueError("Superuser is_superuser=True bo'lishi kerak")
        return self._create_user(email, password, **extra)


class User(AbstractUser):
    class Role(models.TextChoices):
        BUSINESS = "business", "Tadbirkor"
        FORWARDER = "forwarder", "Ekspeditor"

    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=16, choices=Role.choices)
    full_name = models.CharField(max_length=160, blank=True)
    consent_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class BusinessProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="business_profile")
    business_name = models.CharField(max_length=160, blank=True)
    region = models.CharField(max_length=120, blank=True)
    activity = models.CharField(max_length=120, blank=True)
    market = models.CharField(max_length=160, blank=True)

    def __str__(self):
        return self.business_name or f"business:{self.user_id}"


class ForwarderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="forwarder_profile")
    vehicle = models.CharField(max_length=160, blank=True)
    capacity = models.CharField(max_length=80, blank=True)
    region = models.CharField(max_length=120, blank=True)

    def __str__(self):
        return self.vehicle or f"forwarder:{self.user_id}"
