from django.db import models


class BotSession(models.Model):
    telegram_id = models.BigIntegerField(unique=True)
    step = models.CharField(max_length=32, default="start")
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
