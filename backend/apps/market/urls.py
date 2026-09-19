from django.urls import path

from . import views

urlpatterns = [
    path("instruments/", views.instruments),
    path("candles/", views.candles),
    path("fx/", views.fx),
]
