from django.conf import settings
from django.db import models


class NotebookEntry(models.Model):
    class Type(models.TextChoices):
        IN = "in", "Kirim"
        OUT = "out", "Chiqim"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notebook_entries")
    type = models.CharField(max_length=8, choices=Type.choices)
    title = models.CharField(max_length=200)
    amount = models.PositiveBigIntegerField()
    date = models.DateField()
    category = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-id"]
        indexes = [models.Index(fields=["user", "date"])]

    def __str__(self):
        return f"{self.type} {self.amount} · {self.title}"
