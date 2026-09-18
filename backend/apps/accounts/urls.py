from django.urls import path
from . import views

urlpatterns = [
    path("demo/", views.demo_login),
    path("register/", views.register),
    path("telegram/", views.telegram_login),
    path("me/", views.me),
]
