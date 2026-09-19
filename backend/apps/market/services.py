"""Open-source market data: Yahoo Finance charts + open FX (USD→UZS)."""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from typing import Any

from django.core.cache import cache
from django.utils import timezone as dj_tz

from .models import CandleCache, MarketInstrument

USER_AGENT = "BozorPulsAI/1.0 (MVP; educational; +https://localhost)"

# Local food items mapped to open commodity futures (Yahoo) as price drivers.
# close_uzs ≈ base_uzs * (yahoo_close / yahoo_ref) — relative move, labeled as proxy.
SEED = [
    # slug, name, category, unit, yahoo, base_uzs, region, market
    ("un", "Un", "Don", "kg", "ZW=F", 9500, "Xorazm", "Urganch dehqon"),
    ("bugdoy", "Bug'doy", "Don", "kg", "ZW=F", 3200, "Toshkent", "Qo'yliq"),
    ("makkajoxori", "Makkajo'xori", "Don", "kg", "ZC=F", 3500, "Samarqand", "Siyob"),
    ("guruch", "Guruch", "Don", "kg", "ZR=F", 14000, "Xorazm", "Urganch"),
    ("shakar", "Shakar", "Yog'-shakar", "kg", "SB=F", 12500, "Toshkent", "Chorsu"),
    ("paxta-yog", "Paxta yog'i", "Yog'-shakar", "litr", "ZL=F", 16000, "Toshkent", "Abu Sahiy"),
    ("kungaboqar-yog", "Kungaboqar yog'i", "Yog'-shakar", "litr", "ZL=F", 18000, "Toshkent", "O'rikzor"),
    ("qahva", "Qahva", "Boshqa", "kg", "KC=F", 140000, "Toshkent", "Chorsu"),
    ("paxta", "Paxta", "Boshqa", "kg", "CT=F", 22000, "Andijon", "Andijon bozor"),
    # No liquid futures — driven by wheat index + own base (explicit proxy)
    ("kartoshka", "Kartoshka", "Sabzavot", "kg", "ZW=F", 4500, "Toshkent", "Qo'yliq"),
    ("piyoz", "Piyoz", "Sabzavot", "kg", "ZW=F", 3000, "Samarqand", "Siyob"),
    ("sabzi", "Sabzi", "Sabzavot", "kg", "ZC=F", 4000, "Xorazm", "Gurlan"),
    ("pomidor", "Pomidor", "Sabzavot", "kg", "KC=F", 8000, "Toshkent", "Chorsu"),
    ("mol-gosht", "Mol go'shti", "Go'sht", "kg", "LE=F", 95000, "Toshkent", "Chorsu"),
    ("tovuq", "Tovuq", "Go'sht", "kg", "LE=F", 28000, "Toshkent", "O'rikzor"),
]


def ensure_instruments():
    for row in SEED:
        slug, name, cat, unit, yahoo, base, region, market = row
        MarketInstrument.objects.update_or_create(
            slug=slug,
            defaults={
                "name_uz": name,
                "category": cat,
                "unit": unit,
                "yahoo_symbol": yahoo,
                "base_uzs": base,
                "region": region,
                "market_name": market,
                "is_active": True,
            },
        )


def _http_get(url: str, timeout: int = 20) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_usd_uzs() -> float:
    cached = cache.get("fx_usd_uzs")
    if cached:
        return float(cached)
    # Open ER API — no key
    data = _http_get("https://open.er-api.com/v6/latest/USD")
    rate = float(data["rates"]["UZS"])
    cache.set("fx_usd_uzs", rate, 3600)
    return rate


def fetch_yahoo_ohlc(symbol: str, range_: str = "3mo", interval: str = "1d") -> list[dict]:
    cache_key = f"yahoo:{symbol}:{range_}:{interval}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    q = urllib.parse.urlencode({"range": range_, "interval": interval})
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?{q}"
    try:
        data = _http_get(url)
    except urllib.error.HTTPError:
        # fallback chart CDN host
        url = f"https://query2.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?{q}"
        data = _http_get(url)
    result = data["chart"]["result"][0]
    ts = result["timestamp"]
    qoute = result["indicators"]["quote"][0]
    rows = []
    for i, t in enumerate(ts):
        o, h, l, c = qoute["open"][i], qoute["high"][i], qoute["low"][i], qoute["close"][i]
        if None in (o, h, l, c):
            continue
        d = datetime.fromtimestamp(t, tz=timezone.utc).date()
        rows.append({"date": d, "open": float(o), "high": float(h), "low": float(l), "close": float(c)})
    cache.set(cache_key, rows, 1800)
    return rows


def _scale_to_uzs(base_uzs: int, yahoo_rows: list[dict]) -> list[dict]:
    if not yahoo_rows:
        return []
    ref = yahoo_rows[0]["close"] or 1.0
    out = []
    for r in yahoo_rows:
        factor = r["close"] / ref
        # Keep relative OHLC shape around local base
        mid = base_uzs * factor
        scale = mid / (r["close"] or 1)
        out.append(
            {
                "date": r["date"],
                "open": max(1, int(r["open"] * scale)),
                "high": max(1, int(r["high"] * scale)),
                "low": max(1, int(r["low"] * scale)),
                "close": max(1, int(r["close"] * scale)),
            }
        )
    return out


def sync_instrument(inst: MarketInstrument, days: int = 90) -> list[CandleCache]:
    range_ = "3mo" if days <= 95 else "6mo"
    yahoo = fetch_yahoo_ohlc(inst.yahoo_symbol or "ZW=F", range_=range_)
    scaled = _scale_to_uzs(inst.base_uzs, yahoo)
    cutoff = date.today() - timedelta(days=days)
    saved = []
    for row in scaled:
        if row["date"] < cutoff:
            continue
        obj, _ = CandleCache.objects.update_or_create(
            instrument=inst,
            date=row["date"],
            defaults={
                "open": row["open"],
                "high": row["high"],
                "low": row["low"],
                "close": row["close"],
                "source": f"yahoo:{inst.yahoo_symbol}",
            },
        )
        saved.append(obj)
    return saved


def instrument_payload(inst: MarketInstrument) -> dict:
    last = CandleCache.objects.filter(instrument=inst).order_by("-date").first()
    prev = None
    if last:
        prev = CandleCache.objects.filter(instrument=inst, date__lt=last.date).order_by("-date").first()
    change = 0.0
    if last and prev and prev.close:
        change = (last.close - prev.close) / prev.close * 100
    return {
        "slug": inst.slug,
        "name": inst.name_uz,
        "code": inst.slug[:2].upper(),
        "category": inst.category,
        "unit": inst.unit,
        "price": last.close if last else inst.base_uzs,
        "change_pct": round(change, 2),
        "region": inst.region,
        "market": inst.market_name,
        "yahoo_symbol": inst.yahoo_symbol,
        "source": last.source if last else "seed",
        "as_of": str(last.date) if last else None,
        "proxy_note": "Mahalliy narx: ochiq Yahoo futures indeksi + bazaviy UZS kalibratsiya (proxy).",
    }


def candles_payload(inst: MarketInstrument, days: int = 90) -> dict:
    qs = CandleCache.objects.filter(instrument=inst).order_by("date")
    if days:
        cutoff = date.today() - timedelta(days=days)
        qs = qs.filter(date__gte=cutoff)
    points = [
        {
            "time": str(c.date),
            "open": c.open,
            "high": c.high,
            "low": c.low,
            "close": c.close,
        }
        for c in qs
    ]
    return {
        "product": instrument_payload(inst),
        "days": days,
        "candles": points,
        "source": points and CandleCache.objects.filter(instrument=inst).order_by("-date").first().source,
        "fetched_at": dj_tz.now().isoformat(),
        "disclaimer": "Grafik ochiq Yahoo Finance futures OHLC asosida mahalliy UZS ga masshtablangan. Bu kafolatlangan bozor narxi emas.",
    }
