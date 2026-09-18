from __future__ import annotations

import math
from typing import Any

import numpy as np


def monte_carlo(
    monthly_revenue: int,
    monthly_fixed: int,
    materials: list[dict[str, Any]],
    loan_payment: int = 0,
    n: int = 1000,
    seed: int = 42,
) -> dict:
    """materials: [{name, qty_month, price, sigma}] sigma is daily-ish vol annualized-to-month."""
    rng = np.random.default_rng(seed)
    t = 1.0  # one month horizon in GBM
    profits = []
    factor_draws = {m["name"]: [] for m in materials}
    factor_draws["sotuv"] = []
    for _ in range(n):
        cost = 0
        for m in materials:
            sigma = float(m.get("sigma") or 0.08)
            z = float(rng.normal())
            price = m["price"] * math.exp(sigma * math.sqrt(t) * z - 0.5 * sigma * sigma * t)
            factor_draws[m["name"]].append(price)
            cost += price * float(m.get("qty_month") or 0)
        sales = float(rng.normal(monthly_revenue, 0.15 * monthly_revenue))
        factor_draws["sotuv"].append(sales)
        profit = sales - cost - monthly_fixed - loan_payment
        profits.append(profit)
    arr = np.array(profits)
    p_loss = float((arr < 0).mean())
    p10, p50, p90 = [int(x) for x in np.percentile(arr, [10, 50, 90])]
    corrs = {}
    for name, values in factor_draws.items():
        if np.std(values) == 0:
            corrs[name] = 0.0
        else:
            corrs[name] = float(np.corrcoef(arr, values)[0, 1])
    # most dangerous = highest |corr|
    top = max(corrs.items(), key=lambda kv: abs(kv[1]))[0] if corrs else "sotuv"
    # histogram 20 bins
    hist_counts, hist_edges = np.histogram(arr, bins=20)
    histogram = [
        {"x": int((hist_edges[i] + hist_edges[i + 1]) / 2), "n": int(hist_counts[i])}
        for i in range(len(hist_counts))
    ]
    return {
        "n": n,
        "p_loss": p_loss,
        "p10": p10,
        "p50": p50,
        "p90": p90,
        "top_risk_factor": top,
        "correlations": corrs,
        "histogram": histogram,
        "source": "Monte-Karlo / M1 volatillik",
    }


def npv(cashflows: list[int], annual_rate: float) -> int:
    r = annual_rate / 12.0
    total = 0.0
    for i, cf in enumerate(cashflows):
        total += cf / ((1 + r) ** (i + 1))
    return int(total)


def payback_months(investment: int, monthly_net: int) -> int | None:
    if monthly_net <= 0:
        return None
    return int(math.ceil(investment / monthly_net))


def break_even_units(fixed: int, price: int, unit_cost: int) -> int | None:
    margin = price - unit_cost
    if margin <= 0:
        return None
    return int(math.ceil(fixed / margin))


def build_plan(inputs: dict, price_snapshot: dict) -> dict:
    investment = int(inputs.get("investment") or 0)
    employees = int(inputs.get("employees") or 2)
    wage = int(inputs.get("wage") or 2_500_000)
    rent = int(inputs.get("rent") or 5_000_000)
    units_month = int(inputs.get("units_month") or 3000)
    sell_price = int(inputs.get("sell_price") or 8_000)
    months = int(inputs.get("horizon_months") or 24)
    discount = float(inputs.get("discount_rate") or 0.22)

    materials_cost = 0
    materials = []
    for name, qty in (inputs.get("materials") or {}).items():
        price = int((price_snapshot.get(name) or {}).get("price") or 0)
        materials.append({"name": name, "qty_month": float(qty), "price": price, "sigma": (price_snapshot.get(name) or {}).get("sigma", 0.08)})
        materials_cost += int(float(qty) * price)

    labor = employees * wage
    fixed = labor + rent + int(inputs.get("other_fixed") or 1_000_000)
    revenue = units_month * sell_price
    monthly_net = revenue - materials_cost - fixed
    loan_payment = int(inputs.get("loan_payment") or 0)
    monthly_net_after_loan = monthly_net - loan_payment
    cfs = [-investment] + [monthly_net_after_loan] * months
    # npv of operating cashflows minus investment
    op_npv = npv([monthly_net_after_loan] * months, discount) - investment
    pb = payback_months(investment, monthly_net_after_loan)
    bep = break_even_units(fixed, sell_price, int(materials_cost / max(1, units_month)))
    return {
        "revenue_month": revenue,
        "materials_cost_month": materials_cost,
        "fixed_cost_month": fixed,
        "net_month": monthly_net_after_loan,
        "npv": op_npv,
        "payback_months": pb,
        "break_even_units": bep,
        "materials": materials,
        "source": "kalkulyator + BozorPuls narxi",
    }


def credit_readiness_score(
    has_plan: bool,
    has_ledger_report: bool,
    legal_status: str,
    ledger_days_60: int,
    profit_margin: float,
    p_loss: float,
    dscr: float,
) -> dict:
    docs = 0
    if has_plan:
        docs += 40
    if has_ledger_report:
        docs += 40
    if legal_status in ("yatt", "llc"):
        docs += 20
    docs = min(100, docs)

    regularity = min(100, int(ledger_days_60 / 60 * 100))
    # 0% margin -> 0, 20%+ -> 100
    rentab = int(max(0.0, min(1.0, profit_margin / 0.20)) * 100)
    stress = int((1 - min(1.0, max(0.0, p_loss))) * 100)
    dscr_score = int(min(100, dscr / 1.5 * 100))
    status_map = {"informal": 0, "self_employed": 60, "yatt": 100, "llc": 100}
    status_score = status_map.get(legal_status, 0)

    factors = [
        {"key": "docs", "label": "Moliyaviy hujjatlar", "weight": 20, "score": docs},
        {"key": "ledger", "label": "Daftar muntazamligi", "weight": 20, "score": regularity},
        {"key": "profit", "label": "Rentabellik", "weight": 20, "score": rentab},
        {"key": "stress", "label": "Stress-testga chidamlilik", "weight": 15, "score": stress},
        {"key": "dscr", "label": "Qarz yuklamasi (DSCR)", "weight": 15, "score": dscr_score},
        {"key": "status", "label": "Rasmiy maqom", "weight": 10, "score": status_score},
    ]
    total = int(round(sum(f["score"] * f["weight"] / 100 for f in factors)))
    recs = []
    ordered = sorted(factors, key=lambda f: f["score"])
    for f in ordered[:3]:
        if f["key"] == "docs":
            recs.append("Biznes-reja va ovozli daftarni tasdiqlang — hujjat bali oshadi.")
        elif f["key"] == "ledger":
            recs.append("So'nggi 60 kunda har kuni kamida 1 yozuv kiriting.")
        elif f["key"] == "profit":
            recs.append("Xarid agenti orqali xom ashyo xarajatini kamaytiring.")
        elif f["key"] == "stress":
            recs.append("Asosiy xom ashyoga narx ogohlantirishi qo'ying va zaxira shartnoma qiling.")
        elif f["key"] == "dscr":
            recs.append("Kredit summasini kichikroq qiling yoki imtiyozli dastur tanlang.")
        elif f["key"] == "status":
            recs.append("YaTT yoki o'zini o'zi band sifatida ro'yxatdan o'ting.")
    return {
        "score": total,
        "factors": factors,
        "recommendations": recs,
        "disclaimer": "KTI — tavsiya, bank qarori emas. Kredit qarorini bank xodimi qabul qiladi.",
        "source": "KTI uslubiyoti",
    }
