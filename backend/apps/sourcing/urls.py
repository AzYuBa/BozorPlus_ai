from django.urls import path
from . import views

urlpatterns = [
    path("search/", views.search_offers),
    path("rfq/", views.rfq_view),
]
