from django.urls import path
from . import views

urlpatterns = [
    path("overview/", views.admin_overview),
    path("report/", views.admin_report),
]
