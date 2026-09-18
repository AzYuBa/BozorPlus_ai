from django.contrib import admin
from .models import User, AuditLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "role", "telegram_id", "reputation", "points")
    list_filter = ("role",)


admin.site.register(AuditLog)
