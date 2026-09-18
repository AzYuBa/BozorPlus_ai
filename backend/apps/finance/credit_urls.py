from django.urls import path
from .credit_views import credit_readiness

urlpatterns = [path("<int:business_id>/", credit_readiness)]
