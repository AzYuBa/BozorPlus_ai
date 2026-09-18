from django.contrib import admin
from .models import Business, LedgerEntry

admin.site.register(Business)
admin.site.register(LedgerEntry)
