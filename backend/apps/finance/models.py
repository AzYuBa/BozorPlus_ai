from django.conf import settings
from django.db import models


class LoanProgram(models.Model):
    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=160)
    rate = models.DecimalField(max_digits=7, decimal_places=4)
    max_amount = models.BigIntegerField()
    term_months = models.PositiveIntegerField(default=24)
    grace_months = models.PositiveIntegerField(default=0)
    collateral = models.CharField(max_length=160, blank=True)
    guarantee_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    subsidy_rule = models.JSONField(default=dict, blank=True)
    eligibility = models.JSONField(default=dict, blank=True)
    legal_ref_url = models.URLField(blank=True)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.provider})"


class TaxRule(models.Model):
    regime = models.CharField(max_length=64)
    rate = models.DecimalField(max_digits=7, decimal_places=4)
    base = models.CharField(max_length=32, default="turnover")
    threshold_min = models.BigIntegerField(default=0)
    threshold_max = models.BigIntegerField(null=True, blank=True)
    sector_filter = models.JSONField(default=list, blank=True)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    legal_ref_url = models.URLField(blank=True)
    note = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.regime} {self.rate}%"


class BusinessPlan(models.Model):
    business = models.ForeignKey("ledger.Business", on_delete=models.CASCADE, related_name="plans")
    title = models.CharField(max_length=200)
    inputs = models.JSONField(default=dict)
    outputs = models.JSONField(default=dict)
    price_snapshot = models.JSONField(default=dict)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class StressTestRun(models.Model):
    plan = models.ForeignKey(BusinessPlan, on_delete=models.CASCADE, related_name="stress_runs")
    n = models.PositiveIntegerField(default=1000)
    p_loss = models.FloatField()
    p10 = models.BigIntegerField()
    p50 = models.BigIntegerField()
    p90 = models.BigIntegerField()
    top_risk_factor = models.CharField(max_length=64)
    histogram = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)


class CreditReadiness(models.Model):
    business = models.ForeignKey("ledger.Business", on_delete=models.CASCADE, related_name="kti")
    score = models.PositiveIntegerField()
    factors = models.JSONField(default=dict)
    recommendations = models.JSONField(default=list)
    computed_at = models.DateTimeField(auto_now=True)


class CreditPackage(models.Model):
    business = models.ForeignKey("ledger.Business", on_delete=models.CASCADE, related_name="packages")
    plan = models.ForeignKey(BusinessPlan, null=True, blank=True, on_delete=models.SET_NULL)
    file_url = models.CharField(max_length=512, blank=True)
    summary = models.JSONField(default=dict)
    consent = models.BooleanField(default=False)
    sent_to_bank_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
