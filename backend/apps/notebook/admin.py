from django.contrib import admin

from .models import NotebookEntry


@admin.register(NotebookEntry)
class NotebookEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "title", "amount", "date")
    list_filter = ("type", "category")
    search_fields = ("title", "user__email")
