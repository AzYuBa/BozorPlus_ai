from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP


def _to_decimal(x) -> Decimal:
    return Decimal(str(x))


def annuity_payment(principal: int, annual_rate: float, months: int) -> int:
    """Monthly annuity. principal in som, annual_rate like 0.218."""
    if months <= 0:
        return 0
    r = _to_decimal(annual_rate) / Decimal(12)
    s = _to_decimal(principal)
    if r == 0:
        return int((s / months).to_integral_value(rounding=ROUND_HALF_UP))
    one = Decimal(1)
    factor = (one + r) ** months
    a = s * r * factor / (factor - one)
    return int(a.to_integral_value(rounding=ROUND_HALF_UP))


def differential_schedule(principal: int, annual_rate: float, months: int, grace: int = 0) -> list[dict]:
    r = _to_decimal(annual_rate) / Decimal(12)
    s = _to_decimal(principal)
    rows = []
    remaining = s
    amort_months = max(1, months - grace)
    principal_part = s / amort_months
    for k in range(1, months + 1):
        interest = remaining * r
        if k <= grace:
            pmt_principal = Decimal(0)
        else:
            pmt_principal = principal_part
        payment = pmt_principal + interest
        remaining = remaining - pmt_principal
        if remaining < 0:
            remaining = Decimal(0)
        rows.append(
            {
                "month": k,
                "principal": int(pmt_principal.to_integral_value(rounding=ROUND_HALF_UP)),
                "interest": int(interest.to_integral_value(rounding=ROUND_HALF_UP)),
                "payment": int(payment.to_integral_value(rounding=ROUND_HALF_UP)),
                "remaining": int(remaining.to_integral_value(rounding=ROUND_HALF_UP)),
            }
        )
    return rows


def annuity_schedule(principal: int, annual_rate: float, months: int, grace: int = 0) -> list[dict]:
    r = _to_decimal(annual_rate) / Decimal(12)
    s = _to_decimal(principal)
    rows = []
    remaining = s
    pay_months = max(1, months - grace)
    a = _to_decimal(annuity_payment(principal, annual_rate, pay_months))
    for k in range(1, months + 1):
        interest = remaining * r
        if k <= grace:
            pmt_principal = Decimal(0)
            payment = interest
        else:
            payment = a
            pmt_principal = payment - interest
        remaining = remaining - pmt_principal
        if remaining < 0:
            remaining = Decimal(0)
        rows.append(
            {
                "month": k,
                "principal": int(pmt_principal.to_integral_value(rounding=ROUND_HALF_UP)),
                "interest": int(interest.to_integral_value(rounding=ROUND_HALF_UP)),
                "payment": int(payment.to_integral_value(rounding=ROUND_HALF_UP)),
                "remaining": int(remaining.to_integral_value(rounding=ROUND_HALF_UP)),
            }
        )
    return rows


def effective_rate(nominal: float, subsidy: float = 0.0) -> float:
    return max(0.0, float(nominal) - float(subsidy))


def loan_summary(principal: int, annual_rate: float, months: int, kind: str = "annuity", grace: int = 0, subsidy: float = 0.0):
    rate = effective_rate(annual_rate, subsidy)
    if kind == "differential":
        schedule = differential_schedule(principal, rate, months, grace)
    else:
        schedule = annuity_schedule(principal, rate, months, grace)
    total = sum(r["payment"] for r in schedule)
    interest = total - principal
    monthly = schedule[grace]["payment"] if grace < len(schedule) else schedule[-1]["payment"]
    return {
        "principal": principal,
        "annual_rate": annual_rate,
        "effective_rate": rate,
        "subsidy": subsidy,
        "months": months,
        "grace": grace,
        "type": kind,
        "monthly_payment": monthly,
        "total_payment": total,
        "total_interest": interest,
        "schedule": schedule[:36],
        "schedule_len": len(schedule),
        "source": "kalkulyator",
    }
