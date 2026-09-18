from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.prices.models import PriceDaily, PriceObservation
from .models import District, Market, Region


@api_view(["GET"])
@permission_classes([AllowAny])
def geo(request):
    regions = []
    for r in Region.objects.all():
        districts = [
            {"id": d.id, "slug": d.slug, "name_uz": d.name_uz, "is_city": d.is_city}
            for d in r.districts.all()
        ]
        regions.append({"id": r.id, "slug": r.slug, "name_uz": r.name_uz, "districts": districts})
    markets = [
        {
            "id": m.id,
            "slug": m.slug,
            "name_uz": m.name_uz,
            "type": m.type,
            "lat": m.lat,
            "lng": m.lng,
            "district": m.district.name_uz,
        }
        for m in Market.objects.select_related("district")
    ]
    return Response({"regions": regions, "markets": markets})


@api_view(["GET"])
@permission_classes([AllowAny])
def admin_overview(request):
    today = timezone.now().date()
    anomalies = PriceObservation.objects.filter(status="review").count()
    last24 = PriceObservation.objects.filter(observed_at__gte=timezone.now() - timedelta(hours=24)).count()
    social = []
    from apps.catalog.models import Product

    for p in Product.objects.filter(is_social=True):
        last = PriceDaily.objects.filter(product=p).order_by("-date").first()
        prev = PriceDaily.objects.filter(product=p, date__lt=today).order_by("-date").first()
        if last:
            chg = 0
            if prev and prev.close:
                chg = (last.close - prev.close) / prev.close * 100
            social.append({"product": p.name_uz, "slug": p.slug, "price": last.close, "change_pct": round(chg, 2)})
    return Response(
        {
            "anomalies": anomalies,
            "obs_24h": last24,
            "social": social,
            "speculation_alerts": [s for s in social if s["change_pct"] >= 15],
            "source": "agregat narxlar (sotuvchi shaxsiy ma'lumoti yo'q)",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def admin_report(request):
    return Response(
        {
            "title": "Haftalik bozor hisoboti",
            "summary": "Ijtimoiy tovarlar indeksi va anomaliyalar DEMO ma'lumot asosida.",
            "file_url": "",
            "source": "BozorPuls",
        }
    )
