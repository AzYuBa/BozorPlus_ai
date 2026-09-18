from django.conf import settings
from django.db import models


class Business(models.Model):
    class LegalStatus(models.TextChoices):
        INFORMAL = "informal", "Norasmiy"
        SELF_EMPLOYED = "self_employed", "O'zini o'zi band"
        YATT = "yatt", "YaTT"
        LLC = "llc", "MChJ"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="businesses")
    name = models.CharField(max_length=160)
    sector = models.CharField(max_length=64, default="ovqatlanish")
    district = models.ForeignKey("markets.District", on_delete=models.CASCADE, related_name="businesses")
    legal_status = models.CharField(max_length=24, choices=LegalStatus.choices, default=LegalStatus.INFORMAL)
    tax_regime = models.CharField(max_length=32, blank=True)
    monthly_revenue = models.BigIntegerField(default=0)
    employees = models.PositiveIntegerField(default=2)
    is_demo = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class LedgerEntry(models.Model):
    class Type(models.TextChoices):
        INCOME = "income", "Kirim"
        EXPENSE = "expense", "Chiqim"

    class Source(models.TextChoices):
        VOICE = "voice", "Ovoz"
        TEXT = "text", "Matn"
        MANUAL = "manual", "Qo'lda"

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="entries")
    type = models.CharField(max_length=16, choices=Type.choices)
    amount = models.BigIntegerField()
    category = models.CharField(max_length=64, blank=True)
    product = models.ForeignKey("catalog.Product", null=True, blank=True, on_delete=models.SET_NULL)
    qty = models.DecimalField(max_digits=14, decimal_places=3, null=True, blank=True)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.MANUAL)
    raw_text = models.TextField(blank=True)
    confirmed = models.BooleanField(default=False)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]
