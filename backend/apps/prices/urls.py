from django.urls import path
from . import views

urlpatterns = [
    path("ingest/", views.ingest),
    path("<int:pk>/confirm/", views.confirm),
    path("pulse/", views.pulse),
    path("ohlc/", views.ohlc),
    path("compare/", views.compare),
    path("moderation/", views.moderation_queue),
]
