from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MarketInstrument
from .services import candles_payload, ensure_instruments, instrument_payload, sync_instrument


@api_view(["GET"])
@permission_classes([AllowAny])
def instruments(request):
    ensure_instruments()
    refresh = request.query_params.get("refresh") == "1"
    for inst in MarketInstrument.objects.filter(is_active=True):
        if refresh or not inst.candles.exists():
            try:
                sync_instrument(inst)
            except Exception:
                # seed price still returned below
                pass
    items = [
        instrument_payload(inst)
        for inst in MarketInstrument.objects.filter(is_active=True).order_by("name_uz")
    ]
    return Response(
        {
            "instruments": items,
            "source": "Yahoo Finance (ochiq chart API) + open.er-api.com USD/UZS",
            "note": "Mahsulot narxlari futures indeksi proxy + mahalliy baza. Manba har mahsulotda ko'rsatiladi.",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def candles(request):
    ensure_instruments()
    slug = request.query_params.get("product") or "un"
    days = int(request.query_params.get("days") or 90)
    days = max(7, min(days, 180))
    inst = MarketInstrument.objects.filter(slug=slug, is_active=True).first()
    if not inst:
        return Response({"error": {"code": 404, "message": "Mahsulot topilmadi", "fieldErrors": {}}}, status=404)
    try:
        if not inst.candles.exists() or request.query_params.get("refresh") == "1":
            sync_instrument(inst, days=days)
    except Exception as exc:
        payload = candles_payload(inst, days=days)
        payload["fetch_error"] = str(exc)
        if not payload["candles"]:
            return Response(
                {
                    "error": {
                        "code": 503,
                        "message": "Ochiq manbadan ma'lumot olinmadi",
                        "fieldErrors": {},
                        "detail": str(exc),
                    }
                },
                status=503,
            )
        return Response(payload)
    return Response(candles_payload(inst, days=days))


@api_view(["GET"])
@permission_classes([AllowAny])
def fx(request):
    from .services import fetch_usd_uzs

    try:
        rate = fetch_usd_uzs()
        return Response({"base": "USD", "UZS": rate, "source": "open.er-api.com"})
    except Exception as exc:
        return Response({"error": {"code": 503, "message": str(exc), "fieldErrors": {}}}, status=503)
