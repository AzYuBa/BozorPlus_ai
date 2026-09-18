from django.contrib import admin
from .models import PriceObservation, PriceDaily, Forecast, PriceAlert


@admin.register(PriceObservation)
class PriceObservationAdmin(admin.ModelAdmin):
    list_display = ("product", "market", "price_per_base_unit", "source_type", "status", "observed_at")
    list_filter = ("status", "source_type")
    actions = ["approve", "reject"]

    @admin.action(description="Tasdiqlash")
    def approve(self, request, qs):
        qs.update(status="ok")

    @admin.action(description="Rad etish")
    def reject(self, request, qs):
        qs.update(status="rejected")


admin.site.register(PriceDaily)
admin.site.register(Forecast)
admin.site.register(PriceAlert)
