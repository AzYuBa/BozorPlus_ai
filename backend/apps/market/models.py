from django.db import models


class MarketInstrument(models.Model):
    slug = models.SlugField(unique=True)
    name_uz = models.CharField(max_length=128)
    category = models.CharField(max_length=64, blank=True)
    unit = models.CharField(max_length=16, default="kg")
    yahoo_symbol = models.CharField(max_length=32, blank=True)
    # Approx local UZS/kg when yahoo is USD/unit futures — calibrated demo bases
    base_uzs = models.PositiveIntegerField(default=0)
    region = models.CharField(max_length=64, default="O'zbekiston")
    market_name = models.CharField(max_length=128, default="Milliy o'rtacha")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name_uz


class CandleCache(models.Model):
    instrument = models.ForeignKey(MarketInstrument, on_delete=models.CASCADE, related_name="candles")
    date = models.DateField()
    open = models.BigIntegerField()
    high = models.BigIntegerField()
    low = models.BigIntegerField()
    close = models.BigIntegerField()
    source = models.CharField(max_length=64, default="yahoo")
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("instrument", "date")
        ordering = ["date"]
        indexes = [models.Index(fields=["instrument", "date"])]
