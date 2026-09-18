from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.db.models import Avg, Count, Max, Min
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.ai.services.anomaly import is_anomalous
from apps.ai.services.extract import extract_price_rule_based
from apps.ai.services.forecast import backtest_mape, holt_linear, signal_from_forecast
from apps.catalog.models import Product
from apps.markets.models import Market
from .models import Forecast, PriceDaily, PriceObservation


SOURCE_WEIGHT = {
    "stat": 1.0,
    "uzex": 1.0,
    "partner": 0.9,
    "scrape": 0.7,
    "crowd": 0.5,
    "demo": 0.4,
}


def product_payload():
    return list(
        Product.objects.values("id", "slug", "name_uz", "name_ru", "aliases", "base_unit", "typical_pack_qty")
    )


def resolve_market(hint: str | None, user=None):
    if hint:
        m = Market.objects.filter(name_uz__icontains=hint).first() or Market.objects.filter(slug__icontains=hint.lower()).first()
        if m:
            return m
    if user and getattr(user, "district_id", None):
        m = Market.objects.filter(district_id=user.district_id).first()
        if m:
            return m
    return Market.objects.filter(slug="urganch-markaziy").first() or Market.objects.first()


@api_view(["POST"])
@permission_classes([AllowAny])
def ingest(request):
    text = request.data.get("text") or ""
    if not text:
        return Response({"detail": "text kerak"}, status=400)
    parsed = extract_price_rule_based(text, product_payload())
    product = None
    if parsed.get("product_slug"):
        product = Product.objects.filter(slug=parsed["product_slug"]).first()
    if not product:
        return Response({"parsed": parsed, "detail": "Mahsulot aniqlanmadi"}, status=422)
    market = resolve_market(parsed.get("market_hint"), request.user if request.user.is_authenticated else None)
    price = parsed.get("price_per_base_unit")
    if not price:
        return Response({"parsed": parsed, "detail": "Narx aniqlanmadi"}, status=422)

    recent = list(
        PriceDaily.objects.filter(product=product, market=market)
        .order_by("-date")
        .values_list("close", flat=True)[:30]
    )
    anomalous, z = is_anomalous(float(price), recent or [price])
    status_val = PriceObservation.Status.REVIEW if anomalous or parsed["confidence"] < 0.75 else PriceObservation.Status.OK
    obs = PriceObservation.objects.create(
        product=product,
        market=market,
        price_per_base_unit=int(price),
        qty=parsed.get("qty") or 1,
        unit=parsed.get("unit") or product.base_unit,
        raw_text=text,
        source_type=PriceObservation.Source.CROWD,
        confidence=parsed["confidence"],
        status=status_val,
        user=request.user if request.user.is_authenticated else None,
        anomaly_z=z,
        observed_at=timezone.now(),
        parsed=parsed,
    )
    return Response(
        {
            "id": obs.id,
            "status": obs.status,
            "anomaly": anomalous,
            "z": z,
            "parsed": parsed,
            "product": {"id": product.id, "name_uz": product.name_uz, "slug": product.slug, "unit": product.base_unit},
            "market": {"id": market.id, "name_uz": market.name_uz},
            "price_per_base_unit": obs.price_per_base_unit,
            "message": f"{product.name_uz} — {obs.price_per_base_unit:,} so'm/{product.base_unit}, {market.name_uz}. To'g'rimi?",
            "source": "narx bazasi",
            "demo": False,
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm(request, pk: int):
    obs = PriceObservation.objects.filter(pk=pk).first()
    if not obs:
        return Response(status=404)
    ok = bool(request.data.get("ok", True))
    obs.status = PriceObservation.Status.OK if ok else PriceObservation.Status.REJECTED
    obs.save(update_fields=["status"])
    if ok and obs.user:
        obs.user.points += 10
        obs.user.save(update_fields=["points"])
        upsert_today(obs)
    return Response({"status": obs.status, "points": getattr(obs.user, "points", None)})


def upsert_today(obs: PriceObservation):
    d = timezone.localtime(obs.observed_at).date() if timezone.is_aware(obs.observed_at) else obs.observed_at.date()
    row, _ = PriceDaily.objects.get_or_create(
        product=obs.product,
        market=obs.market,
        date=d,
        defaults={
            "open": obs.price_per_base_unit,
            "high": obs.price_per_base_unit,
            "low": obs.price_per_base_unit,
            "close": obs.price_per_base_unit,
            "median": obs.price_per_base_unit,
            "n_obs": 1,
            "is_demo": False,
        },
    )
    if not _:
        row.close = obs.price_per_base_unit
        row.high = max(row.high, obs.price_per_base_unit)
        row.low = min(row.low, obs.price_per_base_unit)
        row.n_obs += 1
        row.is_demo = False
        row.save()


@api_view(["GET"])
@permission_classes([AllowAny])
def pulse(request):
    days = int(request.query_params.get("days") or 1)
    today = timezone.now().date()
    prev = today - timedelta(days=days)
    rows = []
    products = Product.objects.filter(is_social=True) | Product.objects.all()[:24]
    products = products.distinct()
    for p in products:
        last = (
            PriceDaily.objects.filter(product=p, date__lte=today)
            .values("date")
            .annotate(px=Avg("close"))
            .order_by("-date")
        )
        last = list(last[:2])
        if not last:
            continue
        close = int(last[0]["px"])
        prev_px = int(last[1]["px"]) if len(last) > 1 else close
        chg = (close - prev_px) / prev_px * 100 if prev_px else 0
        rows.append(
            {
                "product_id": p.id,
                "slug": p.slug,
                "name": p.name_uz,
                "unit": p.base_unit,
                "price": close,
                "change_pct": round(chg, 2),
                "is_social": p.is_social,
            }
        )
    rows.sort(key=lambda r: abs(r["change_pct"]), reverse=True)
    social = [r for r in rows if r["is_social"]]
    social_idx = 0
    if social:
        social_idx = round(sum(r["change_pct"] for r in social) / len(social), 2)
    return Response(
        {
            "as_of": str(today),
            "ticker": rows[:18],
            "gainers": sorted(rows, key=lambda r: r["change_pct"], reverse=True)[:5],
            "losers": sorted(rows, key=lambda r: r["change_pct"])[:5],
            "social_index_change_pct": social_idx,
            "demo": True,
            "source": "BozorPuls narx bazasi",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def ohlc(request):
    slug = request.query_params.get("product")
    market_slug = request.query_params.get("market")
    days = int(request.query_params.get("days") or 90)
    product = Product.objects.filter(slug=slug).first() or Product.objects.filter(id=slug).first()
    if not product:
        return Response({"detail": "product topilmadi"}, status=404)
    qs = PriceDaily.objects.filter(product=product, date__gte=timezone.now().date() - timedelta(days=days))
    if market_slug:
        qs = qs.filter(market__slug=market_slug)
        series = [
            {"time": str(r.date), "open": r.open, "high": r.high, "low": r.low, "close": r.close, "n": r.n_obs, "demo": r.is_demo}
            for r in qs.order_by("date")
        ]
        markets = []
    else:
        # aggregate across markets: median close as close
        from django.db.models import Avg

        grouped = (
            qs.values("date")
            .annotate(open=Avg("open"), high=Max("high"), low=Min("low"), close=Avg("close"), n=Count("id"))
            .order_by("date")
        )
        series = [
            {
                "time": str(g["date"]),
                "open": int(g["open"]),
                "high": int(g["high"]),
                "low": int(g["low"]),
                "close": int(g["close"]),
                "n": g["n"],
                "demo": True,
            }
            for g in grouped
        ]
    table = []
    for m in Market.objects.all():
        last = PriceDaily.objects.filter(product=product, market=m).order_by("-date").first()
        if last:
            table.append(
                {
                    "market": m.name_uz,
                    "market_slug": m.slug,
                    "price": last.close,
                    "date": str(last.date),
                    "n_obs": last.n_obs,
                }
            )
    return Response(
        {
            "product": {"id": product.id, "name_uz": product.name_uz, "slug": product.slug, "unit": product.base_unit},
            "series": series,
            "markets": table,
            "source": "BozorPuls OHLC",
            "demo": True,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def compare(request):
    slug = request.query_params.get("product")
    product = Product.objects.filter(slug=slug).first()
    if not product:
        return Response({"detail": "product topilmadi"}, status=404)
    rows = []
    for m in Market.objects.all():
        last = PriceDaily.objects.filter(product=product, market=m).order_by("-date").first()
        if last:
            rows.append({"market": m.name_uz, "slug": m.slug, "price": last.close, "updated": str(last.date), "lat": m.lat, "lng": m.lng})
    if not rows:
        return Response({"product": product.name_uz, "rows": []})
    avg = sum(r["price"] for r in rows) / len(rows)
    for r in rows:
        r["diff_som"] = int(r["price"] - avg)
        r["diff_pct"] = round((r["price"] - avg) / avg * 100, 2)
    rows.sort(key=lambda r: r["price"])
    return Response({"product": product.name_uz, "unit": product.base_unit, "avg": int(avg), "rows": rows, "source": "BozorPuls"})


@api_view(["GET"])
@permission_classes([AllowAny])
def forecast_view(request):
    slug = request.query_params.get("product")
    market_slug = request.query_params.get("market")
    product = Product.objects.filter(slug=slug).first()
    if not product:
        return Response({"detail": "product topilmadi"}, status=404)
    qs = PriceDaily.objects.filter(product=product)
    if market_slug:
        qs = qs.filter(market__slug=market_slug)
    closes = list(qs.order_by("date").values_list("close", flat=True))
    # if multiple markets without filter, use daily average
    if not market_slug:
        from django.db.models import Avg

        closes = [int(x["c"]) for x in qs.values("date").annotate(c=Avg("close")).order_by("date")]
    yhat, lo, hi = holt_linear([float(c) for c in closes], horizon=7)
    last = float(closes[-1]) if closes else 0
    sig, comment = signal_from_forecast(last, yhat, lo, hi, threshold=getattr(settings, "SIGNAL_THRESHOLD", 0.05))
    bt = backtest_mape([float(c) for c in closes])
    market = Market.objects.filter(slug=market_slug).first() if market_slug else Market.objects.filter(slug="urganch-markaziy").first()
    if market:
        Forecast.objects.update_or_create(
            product=product,
            market=market,
            horizon=7,
            defaults={
                "yhat": yhat,
                "lo": lo,
                "hi": hi,
                "signal": sig,
                "comment": comment,
                "mape": bt,
            },
        )
    start = timezone.now().date() + timedelta(days=1)
    points = [
        {
            "date": str(start + timedelta(days=i)),
            "yhat": int(yhat[i]),
            "lo": int(lo[i]),
            "hi": int(hi[i]),
        }
        for i in range(len(yhat))
    ]
    return Response(
        {
            "product": product.name_uz,
            "signal": sig,
            "comment": comment,
            "mape": round(bt, 4) if bt is not None else None,
            "last_price": int(last),
            "points": points,
            "source": "prognoz modeli (ETS)",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def moderation_queue(request):
    if request.user.role not in ("admin", "market_admin") and not request.user.is_superuser:
        return Response(status=403)
    qs = PriceObservation.objects.filter(status="review")[:100]
    return Response(
        [
            {
                "id": o.id,
                "product": o.product.name_uz,
                "market": o.market.name_uz,
                "price": o.price_per_base_unit,
                "z": o.anomaly_z,
                "raw_text": o.raw_text,
                "user": o.user.username if o.user else None,
                "observed_at": o.observed_at,
            }
            for o in qs
        ]
    )
