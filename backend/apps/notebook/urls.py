from django.urls import path

from . import views

urlpatterns = [
    path("entries/", views.entries),
    path("entries/<int:pk>/", views.entry_detail),
]
