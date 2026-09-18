from django.urls import path
from . import views

urlpatterns = [
    path("loan/calc/", views.loan_calc),
    path("programs/match/", views.programs_match),
    path("tax/compare/", views.tax_compare),
    path("status/compare/", views.status_compare),
]
