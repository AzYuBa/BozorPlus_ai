from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ENTREPRENEUR = "entrepreneur", "Tadbirkor"
        SUPPLIER = "supplier", "Yetkazib beruvchi"
        MARKET_ADMIN = "market_admin", "Bozor ma'muri"
        BANK = "bank", "Bank"
        ADMIN = "admin", "Admin"

    telegram_id = models.BigIntegerField(null=True, blank=True, unique=True)
    phone = models.CharField(max_length=32, blank=True)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.ENTREPRENEUR)
    lang = models.CharField(max_length=8, default="uz")
    district = models.ForeignKey(
        "markets.District", null=True, blank=True, on_delete=models.SET_NULL, related_name="users"
    )
    reputation = models.DecimalField(max_digits=5, decimal_places=2, default=1)
    consent_at = models.DateTimeField(null=True, blank=True)
    points = models.IntegerField(default=0)

    def __str__(self):
        return self.get_full_name() or self.username


class AuditLog(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=64)
    object_type = models.CharField(max_length=64, blank=True)
    object_id = models.CharField(max_length=64, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
