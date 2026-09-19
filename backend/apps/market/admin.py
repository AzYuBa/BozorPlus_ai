from django.contrib import admin

from .models import CandleCache, MarketInstrument


@admin.register(MarketInstrument)
class MarketInstrumentAdmin(admin.ModelAdmin):
    list_display = ("slug", "name_uz", "yahoo_symbol", "base_uzs", "is_active")


@admin.register(CandleCache)
class CandleCacheAdmin(admin.ModelAdmin):
    list_display = ("instrument", "date", "close", "source")
    list_filter = ("instrument",)
