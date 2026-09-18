from django.urls import path
from . import views

urlpatterns = [
    path("voice/", views.voice_entry),
    path("voice/<int:pk>/confirm/", views.confirm_entry),
    path("report/", views.report),
]
