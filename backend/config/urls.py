from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.accounts.me_urls")),
    path("api/v1/notebook/", include("apps.notebook.urls")),
    path("api/v1/market/", include("apps.market.urls")),
    path("api/v1/ai/", include("apps.ai.urls")),
]
