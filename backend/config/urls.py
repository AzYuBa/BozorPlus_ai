from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/catalog/", include("apps.catalog.urls")),
    path("api/markets/", include("apps.markets.urls")),
    path("api/prices/", include("apps.prices.urls")),
    path("api/forecast/", include("apps.prices.forecast_urls")),
    path("api/sourcing/", include("apps.sourcing.urls")),
    path("api/ledger/", include("apps.ledger.urls")),
    path("api/finance/", include("apps.finance.urls")),
    path("api/plans/", include("apps.finance.plan_urls")),
    path("api/credit-readiness/", include("apps.finance.credit_urls")),
    path("api/credit-package/", include("apps.finance.package_urls")),
    path("api/market-admin/", include("apps.markets.admin_urls")),
    path("api/agent/", include("apps.ai.urls")),
    path("api/bot/", include("apps.bot.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
