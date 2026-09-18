from django.conf import settings
from django.db import models


class LLMCallLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    model = models.CharField(max_length=80)
    tokens_in = models.IntegerField(default=0)
    tokens_out = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    tools = models.JSONField(default=list, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    prompt_preview = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class KnowledgeChunk(models.Model):
    doc_title = models.CharField(max_length=200)
    clause = models.CharField(max_length=64, blank=True)
    text = models.TextField()
    url = models.URLField(blank=True)
    embedding = models.JSONField(null=True, blank=True)
