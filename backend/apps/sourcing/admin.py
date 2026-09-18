from django.contrib import admin
from .models import Supplier, Offer, RFQ, Bid

admin.site.register(Supplier)
admin.site.register(Offer)
admin.site.register(RFQ)
admin.site.register(Bid)
