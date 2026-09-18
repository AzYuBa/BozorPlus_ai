from math import asin, cos, radians, sin, sqrt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.catalog.models import Product
from apps.markets.models import District, Market
from .models import Offer, RFQ, Supplier


def haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 15.0
    r = 6371
    dlat = radians(float(lat2) - float(lat1))
    dlon = radians(float(lon2) - float(lon1))
    a = sin(dlat / 2) ** 2 + cos(radians(float(lat1))) * cos(radians(float(lat2))) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


@api_view(["POST"])
@permission_classes([AllowAny])
def search_offers(request):
    slug = request.data.get("product") or request.data.get("product_slug")
    qty = float(request.data.get("qty") or request.data.get("quantity") or 1)
    unit = request.data.get("unit") or "kg"
    district_slug = request.data.get("district") or "urganch-shahar"
    if unit in ("tonna", "t"):
        qty *= 1000
        unit = "kg"
    product = Product.objects.filter(slug=slug).first() or Product.objects.filter(name_uz__icontains=slug or "").first()
    if not product:
        return Response({"detail": "Mahsulot topilmadi"}, status=404)
    dest = District.objects.filter(slug=district_slug).first() or District.objects.first()
    dest_market = Market.objects.filter(district=dest).first() or Market.objects.first()
    offers = Offer.objects.filter(product=product, is_active=True).select_related("supplier", "market")
    results = []
    for off in offers:
        tons = qty / 1000.0
        km = haversine_km(
            dest_market.lat if dest_market else None,
            dest_market.lng if dest_market else None,
            off.market.lat if off.market else None,
            off.market.lng if off.market else None,
        )
        delivery = int(80_000 + km * 1200 * max(tons, 0.05))
        goods = int(off.price * qty)
        total = goods + delivery
        results.append(
            {
                "supplier": off.supplier.name,
                "phone": off.supplier.phone,
                "rating": float(off.supplier.rating),
                "market": off.market.name_uz if off.market else "",
                "unit_price": off.price,
                "qty": qty,
                "goods": goods,
                "delivery": delivery,
                "km": round(km, 1),
                "total": total,
                "min_qty": float(off.min_qty),
                "message": (
                    f"Assalomu alaykum, {off.supplier.name}! {product.name_uz} {qty:g} {unit} kerak. "
                    f"Taklif: {off.price:,} so'm/{product.base_unit}. BozorPuls orqali yozildi."
                ),
                "demo": off.supplier.is_demo,
            }
        )
    results.sort(key=lambda r: r["total"])
    if not results:
        return Response({"product": product.name_uz, "offers": [], "saving_pct": 0})
    avg = sum(r["total"] for r in results) / len(results)
    best = results[0]["total"]
    saving = (avg - best) / avg * 100 if avg else 0
    for i, r in enumerate(results[:3], 1):
        r["rank"] = i
        r["saving_vs_avg_pct"] = round((avg - r["total"]) / avg * 100, 1)
    return Response(
        {
            "product": product.name_uz,
            "qty": qty,
            "unit": unit,
            "destination": dest.name_uz if dest else "",
            "avg_total": int(avg),
            "saving_pct": round(saving, 1),
            "offers": results[:3],
            "source": "xarid agenti (narx × miqdor + yetkazish)",
        }
    )


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def rfq_view(request):
    if request.method == "GET":
        items = RFQ.objects.select_related("product", "district")[:20]
        return Response(
            [
                {
                    "id": r.id,
                    "product": r.product.name_uz,
                    "qty": float(r.qty),
                    "district": r.district.name_uz,
                    "status": r.status,
                }
                for r in items
            ]
        )
    return Response({"detail": "RFQ P1 demo", "ok": True})
