from django.conf import settings
from django.db import models


class PriceObservation(models.Model):
    class Source(models.TextChoices):
        CROWD = "crowd", "Crowd"
        SCRAPE = "scrape", "Scrape"
        STAT = "stat", "Statistika"
        UZEX = "uzex", "UzEx"
        PARTNER = "partner", "Hamkor"
        DEMO = "demo", "DEMO"

    class Status(models.TextChoices):
        OK = "ok", "OK"
        REVIEW = "review", "Tekshiruvda"
        REJECTED = "rejected", "Rad etilgan"

    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="observations")
    market = models.ForeignKey("markets.Market", on_delete=models.CASCADE, related_name="observations")
    price_per_base_unit = models.BigIntegerField()
    qty = models.DecimalField(max_digits=14, decimal_places=3, default=1)
    unit = models.CharField(max_length=16, default="kg")
    raw_text = models.TextField(blank=True)
    source_type = models.CharField(max_length=16, choices=Source.choices, default=Source.CROWD)
    source_ref = models.CharField(max_length=255, blank=True)
    confidence = models.DecimalField(max_digits=4, decimal_places=3, default=0.8)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OK)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="price_obs"
    )
    media_url = models.CharField(max_length=512, blank=True)
    anomaly_z = models.FloatField(null=True, blank=True)
    observed_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    parsed = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["product", "market", "observed_at"]),
            models.Index(fields=["status", "observed_at"]),
        ]
        ordering = ["-observed_at"]


class PriceDaily(models.Model):
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="daily")
    market = models.ForeignKey("markets.Market", on_delete=models.CASCADE, related_name="daily")
    date = models.DateField()
    open = models.BigIntegerField()
    high = models.BigIntegerField()
    low = models.BigIntegerField()
    close = models.BigIntegerField()
    median = models.BigIntegerField()
    n_obs = models.PositiveIntegerField(default=1)
    is_demo = models.BooleanField(default=False)

    class Meta:
        unique_together = ("product", "market", "date")
        indexes = [models.Index(fields=["product", "market", "date"])]
        ordering = ["date"]


class Forecast(models.Model):
    class Signal(models.TextChoices):
        BUY_NOW = "HOZIR OL", "HOZIR OL"
        WAIT = "KUT", "KUT"
        NEUTRAL = "NEYTRAL", "NEYTRAL"

    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="forecasts")
    market = models.ForeignKey("markets.Market", on_delete=models.CASCADE, related_name="forecasts")
    horizon = models.PositiveIntegerField(default=7)
    yhat = models.JSONField(default=list)
    lo = models.JSONField(default=list)
    hi = models.JSONField(default=list)
    signal = models.CharField(max_length=16, choices=Signal.choices, default=Signal.NEUTRAL)
    comment = models.CharField(max_length=255, blank=True)
    model_version = models.CharField(max_length=32, default="ets-v0")
    mape = models.FloatField(null=True, blank=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product", "market", "horizon")


class PriceAlert(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alerts")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    market = models.ForeignKey("markets.Market", null=True, blank=True, on_delete=models.SET_NULL)
    condition = models.CharField(max_length=16, default="lt")
    threshold = models.BigIntegerField()
    is_active = models.BooleanField(default=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
