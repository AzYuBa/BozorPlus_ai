from django.db import models


class Report(models.Model):
    type = models.CharField(max_length=32)
    params = models.JSONField(default=dict, blank=True)
    file_url = models.CharField(max_length=512, blank=True)
    created_by = models.ForeignKey("accounts.User", null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
