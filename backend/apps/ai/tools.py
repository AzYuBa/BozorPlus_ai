from __future__ import annotations

import re

from django.test import RequestFactory
from rest_framework.request import Request


def _call(view, method, data=None, query=None):
    rf = RequestFactory()
    if method == "GET":
        req = rf.get("/", query or {})
    else:
        req = rf.post("/", data or {}, content_type="application/json")
        req._body = None
    # DRF views expect request.data from parser; use APIRequestFactory-like dict via forcing
    from rest_framework.test import APIRequestFactory

    factory = APIRequestFactory()
    if method == "GET":
        wsgi = factory.get("/", query or {})
    else:
        wsgi = factory.post("/", data or {}, format="json")
    wsgi.user = None
    return view(wsgi)


def search_offers(product, qty, unit="kg", district="urganch-shahar"):
    from apps.sourcing.views import search_offers as v

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    req = factory.post("/", {"product": product, "qty": qty, "unit": unit, "district": district}, format="json")
    return v(req).data


def get_price_stats(product, market=None, days=90):
    from apps.prices.views import ohlc, compare, pulse

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    q = {"product": product, "days": days}
    if market:
        q["market"] = market
    o = ohlc(factory.get("/", q)).data
    c = compare(factory.get("/", {"product": product})).data
    return {"ohlc": o, "compare": c}


def forecast_price(product, market=None, horizon=7):
    from apps.prices.views import forecast_view

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    q = {"product": product}
    if market:
        q["market"] = market
    return forecast_view(factory.get("/", q)).data


def calc_loan(amount, rate=0.218, months=24, type="annuity", grace=0, subsidy=0):
    from apps.finance.views import loan_calc

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    req = factory.post(
        "/",
        {"amount": amount, "rate": rate, "months": months, "type": type, "grace": grace, "subsidy": subsidy},
        format="json",
    )
    return loan_calc(req).data


def match_programs(profile=None):
    from apps.finance.views import programs_match

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    profile = profile or {}
    return programs_match(factory.get("/", profile)).data


def calc_tax(turnover, expenses, sector="savdo", regimes=None):
    from apps.finance.views import tax_compare

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return tax_compare(factory.post("/", {"turnover": turnover, "expenses": expenses, "sector": sector}, format="json")).data


def compare_status(turnover, sector="ovqatlanish", expenses=0):
    from apps.finance.views import status_compare

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return status_compare(factory.post("/", {"turnover": turnover, "expenses": expenses, "sector": sector}, format="json")).data


def build_business_plan(inputs):
    from apps.finance.views import plans

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return plans(factory.post("/", inputs, format="json")).data


def stress_test(plan_id, n=1000):
    from apps.finance.views import stress_test as v

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return v(factory.post("/", {"n": n}, format="json"), pk=plan_id).data


def credit_readiness(business_id=1):
    from apps.finance.credit_views import credit_readiness as v

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return v(factory.get("/"), business_id=business_id).data


def ledger_add(entry_text):
    from apps.ledger.views import voice_entry

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return voice_entry(factory.post("/", {"text": entry_text}, format="json")).data


def ledger_report(period="month"):
    from apps.ledger.views import report

    factory = __import__("rest_framework.test", fromlist=["APIRequestFactory"]).APIRequestFactory()
    return report(factory.get("/", {"period": period})).data


def search_knowledge(query: str):
    from apps.ai.models import KnowledgeChunk

    qs = KnowledgeChunk.objects.all()
    q = (query or "").lower()
    hits = [k for k in qs if q in (k.text + k.doc_title).lower()][:3]
    if not hits:
        hits = list(qs[:3])
    return [{"title": k.doc_title, "clause": k.clause, "text": k.text, "url": k.url} for k in hits]


TOOLS = {
    "search_offers": search_offers,
    "get_price_stats": get_price_stats,
    "forecast_price": forecast_price,
    "calc_loan": calc_loan,
    "match_programs": match_programs,
    "calc_tax": calc_tax,
    "compare_status": compare_status,
    "build_business_plan": build_business_plan,
    "stress_test": stress_test,
    "credit_readiness": credit_readiness,
    "ledger_add": ledger_add,
    "ledger_report": ledger_report,
    "search_knowledge": search_knowledge,
}


def route_message(text: str) -> dict:
    t = (text or "").lower()
    used = []
    data = {}
    reply_parts = []

    def som(n):
        try:
            return f"{int(n):,}".replace(",", " ")
        except Exception:
            return str(n)

    product = "un"
    for slug, keys in [
        ("un", ["un", "мука", "flour"]),
        ("guruch", ["guruch", "рис"]),
        ("mol-gosht", ["go'sht", "gosht", "mol"]),
        ("piyoz", ["piyoz", "лук"]),
        ("kartoshka", ["kartoshka", "картош"]),
        ("shakar", ["shakar", "сахар"]),
    ]:
        if any(k in t for k in keys):
            product = slug
            break

    qty = 500
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(tonna|t\b)", t)
    if m:
        qty = float(m.group(1).replace(",", ".")) * 1000
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*kg", t)
    if m:
        qty = float(m.group(1).replace(",", "."))

    if any(k in t for k in ("kerak", "top", "arzon", "xarid", "olaman")):
        data["offers"] = search_offers(product, qty)
        used.append("search_offers")
        o = data["offers"]
        reply_parts.append(
            f"TOP-3 taklif ({o.get('product')}, {o.get('qty')} kg), yetkazish bilan. Tejash: {o.get('saving_pct')}%."
        )
        for off in o.get("offers") or []:
            reply_parts.append(
                f"{off['rank']}. {off['supplier']} — yakuniy {som(off['total'])} so'm (tovar {som(off['goods'])} + yetkazish {som(off['delivery'])})."
            )

    if any(k in t for k in ("prognoz", "hozir ol", "kut", "signal", "qimmatlash")):
        data["forecast"] = forecast_price(product)
        used.append("forecast_price")
        f = data["forecast"]
        reply_parts.append(f"Signal: {f.get('signal')}. {f.get('comment')} MAPE: {f.get('mape')}.")

    if any(k in t for k in ("kredit", "foiz", "to'lov", "annuitet", "150 mln", "mln")):
        amount = 150_000_000
        m = re.search(r"(\d+)\s*mln", t)
        if m:
            amount = int(m.group(1)) * 1_000_000
        data["loan"] = calc_loan(amount, 0.14, 36, "annuity", 3, 0.04)
        used.append("calc_loan")
        L = data["loan"]
        reply_parts.append(
            f"Kredit {som(amount)} so'm, 36 oy, imtiyozli 14% (4% kompensatsiya). Oylik to'lov: {som(L['monthly_payment'])} so'm."
        )
        data["programs"] = match_programs({"amount": amount})
        used.append("match_programs")

    if any(k in t for k in ("soliq", "qqs", "rejim", "yatt")):
        data["tax"] = calc_tax(800_000_000, 500_000_000, "ovqatlanish")
        used.append("calc_tax")
        rows = data["tax"].get("rows") or []
        if rows:
            reply_parts.append("Soliq rejimlari (yillik):")
            for r in rows[:4]:
                reply_parts.append(f"— {r['regime']}: {som(r['tax'])} so'm (stavka {r['rate']}%). Manba: lex.uz")

    if any(k in t for k in ("rasmiy", "formallash", "norasmiy", "o'zini o'zi")):
        data["status"] = compare_status(800_000_000, "ovqatlanish", 500_000_000)
        used.append("compare_status")
        reply_parts.append("Formallashuv taqqoslovi hisoblandi (norasmiy vs o'zini o'zi band vs YaTT).")

    if any(k in t for k in ("biznes-reja", "biznes reja", "filial", "reja tuz")):
        data["plan"] = build_business_plan(
            {
                "title": "2-filial: somsaxona",
                "investment": 150_000_000,
                "employees": 6,
                "units_month": 8000,
                "sell_price": 9000,
                "materials": {"un": 1500, "mol-gosht": 400, "piyoz": 200},
                "loan_payment": 8_000_000,
            }
        )
        used.append("build_business_plan")
        o = data["plan"].get("outputs") or {}
        reply_parts.append(
            f"Reja: oylik sof {som(o.get('net_month'))} so'm, NPV {som(o.get('npv'))}, o'zini oqlash {o.get('payback_months')} oy. Xom ashyo — BozorPuls narxi."
        )
        if data["plan"].get("id"):
            data["stress"] = stress_test(data["plan"]["id"])
            used.append("stress_test")
            s = data["stress"]
            reply_parts.append(
                f"Stress-test: zarar ehtimoli {s.get('p_loss', 0)*100:.1f}%, eng xavfli omil — {s.get('top_risk_factor')}."
            )

    if any(k in t for k in ("kti", "tayyorlik", "indeks", "3 qadam")):
        data["kti"] = credit_readiness(1)
        used.append("credit_readiness")
        k = data["kti"]
        reply_parts.append(f"Kredit tayyorligi indeksi: {k.get('score')}/100.")
        for rec in (k.get("recommendations") or [])[:3]:
            reply_parts.append(f"• {rec}")

    if any(k in t for k in ("daftar", "sotdim", "to'ladim", "hisobot")):
        if any(k in t for k in ("sotdim", "to'ladim", "ijara")):
            data["ledger"] = ledger_add(text)
            used.append("ledger_add")
        data["ledger_report"] = ledger_report("month")
        used.append("ledger_report")
        r = data["ledger_report"]
        reply_parts.append(f"Daftar: kirim {som(r.get('income'))}, chiqim {som(r.get('expense'))}, sof {som(r.get('net'))} so'm.")

    if not used:
        data["stats"] = get_price_stats(product)
        used.append("get_price_stats")
        o = data["stats"].get("ohlc") or {}
        series = o.get("series") or []
        last = series[-1]["close"] if series else None
        reply_parts.append(
            f"{o.get('product', {}).get('name_uz', product)} so'nggi narxi: {som(last) if last else '—'} so'm. "
            "Kredit, soliq, xarid yoki biznes-reja so'rang — raqamlarni tool orqali hisoblayman."
        )

    reply_parts.append("Ma'lumot uchun; yakuniy qarordan oldin bank yoki soliq maslahatchisi bilan tekshiring.")
    return {
        "reply": "\n".join(reply_parts),
        "tools": used,
        "data": data,
        "disclaimer": True,
        "source": "Xorazmiy agent / tool natijasi",
    }
