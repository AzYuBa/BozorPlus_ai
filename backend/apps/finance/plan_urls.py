from django.urls import path
from . import views

urlpatterns = [
    path("", views.plans),
    path("<int:pk>/stress-test/", views.stress_test),
    path("<int:pk>/export/", views.export_plan),
]
