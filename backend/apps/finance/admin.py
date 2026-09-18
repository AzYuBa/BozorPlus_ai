from django.contrib import admin
from .models import LoanProgram, TaxRule, BusinessPlan, StressTestRun, CreditReadiness, CreditPackage

admin.site.register(LoanProgram)
admin.site.register(TaxRule)
admin.site.register(BusinessPlan)
admin.site.register(StressTestRun)
admin.site.register(CreditReadiness)
admin.site.register(CreditPackage)
