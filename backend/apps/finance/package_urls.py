from django.urls import path
from .credit_views import credit_package

urlpatterns = [path("", credit_package)]
