from django.conf import settings
from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=160)
    district = models.ForeignKey("markets.District", on_delete=models.CASCADE, related_name="suppliers")
    phone = models.CharField(max_length=32, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.5)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="suppliers"
    )
    is_verified = models.BooleanField(default=False)
    is_demo = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Offer(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="offers")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="offers")
    market = models.ForeignKey("markets.Market", null=True, blank=True, on_delete=models.SET_NULL)
    price = models.BigIntegerField(help_text="so'm / base unit")
    min_qty = models.DecimalField(max_digits=14, decimal_places=3, default=1)
    delivery_terms = models.CharField(max_length=255, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)


class RFQ(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Ochiq"
        CLOSED = "closed", "Yopiq"

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rfqs")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    qty = models.DecimalField(max_digits=14, decimal_places=3)
    unit = models.CharField(max_length=16, default="kg")
    district = models.ForeignKey("markets.District", on_delete=models.CASCADE)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Bid(models.Model):
    rfq = models.ForeignKey(RFQ, on_delete=models.CASCADE, related_name="bids")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    price = models.BigIntegerField()
    delivery_cost = models.BigIntegerField(default=0)
    comment = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
