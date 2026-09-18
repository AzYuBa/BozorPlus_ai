from __future__ import annotations

from datetime import date


def tax_burden(turnover: int, expenses: int, sector: str, rules: list[dict]) -> list[dict]:
    profit = max(0, turnover - expenses)
    rows = []
    today = date.today()
    for rule in rules:
        vf = rule.get("valid_from")
        vt = rule.get("valid_to")
        if vf and str(vf) > str(today):
            continue
        if vt and str(vt) < str(today):
            continue
        sectors = rule.get("sector_filter") or []
        if sectors and sector not in sectors and "all" not in sectors:
            continue
        tmin = int(rule.get("threshold_min") or 0)
        tmax = rule.get("threshold_max")
        if turnover < tmin:
            continue
        if tmax is not None and turnover > int(tmax):
            continue
        rate = float(rule["rate"])
        base = rule.get("base") or "turnover"
        taxable = turnover if base == "turnover" else profit
        tax = int(taxable * rate / 100.0)
        net = turnover - expenses - tax
        rows.append(
            {
                "regime": rule["regime"],
                "rate": rate,
                "base": base,
                "tax": tax,
                "net": net,
                "legal_ref_url": rule.get("legal_ref_url") or "",
                "note": rule.get("note") or "",
                "source": "lex.uz / TaxRule",
            }
        )
    rows.sort(key=lambda r: r["tax"])
    return rows


def formalization_compare(turnover: int, expenses: int, sector: str, rules: list[dict]) -> dict:
    variants = []
    for status, label, kti_status, risk, extras in [
        ("informal", "Norasmiy", 0, "yuqori", ["Kredit yo'q", "Keshbek yo'q", "Jarima xavfi"]),
        ("self_employed", "O'zini o'zi band", 60, "o'rta", ["Cheklangan kredit", "Soddalashtirilgan hisob", "Naqd pulsiz qulay"]),
        ("yatt", "YaTT", 100, "past", ["Bank krediti", "Davlat dasturlari", "Keshbek va hisob-faktura"]),
    ]:
        subset = [r for r in rules if status in (r.get("regime") or "").lower() or r.get("for_status") == status]
        if not subset:
            subset = rules
        burdens = tax_burden(turnover, expenses, sector, subset) or [
            {"regime": label, "tax": 0 if status == "informal" else int(turnover * 0.04), "net": turnover - expenses, "legal_ref_url": "", "rate": 0}
        ]
        best = burdens[0]
        # informal: no tax in books but penalty risk estimated 8% of turnover expected loss
        risk_cost = int(turnover * 0.08) if status == "informal" else 0
        credit_access = {0: "yo'q", 60: "cheklangan", 100: "to'liq"}[kti_status]
        variants.append(
            {
                "status": status,
                "label": label,
                "tax": best["tax"],
                "risk_cost": risk_cost,
                "net_after_tax_and_risk": turnover - expenses - best["tax"] - risk_cost,
                "kti_status_score": kti_status,
                "credit_access": credit_access,
                "risk": risk,
                "extras": extras,
                "legal_ref_url": best.get("legal_ref_url"),
                "source": "TaxRule + KTI uslubiyoti",
            }
        )
    best_formal = max(variants, key=lambda v: v["net_after_tax_and_risk"])
    informal = next(v for v in variants if v["status"] == "informal")
    return {
        "variants": variants,
        "best": best_formal["status"],
        "annual_net_diff": best_formal["net_after_tax_and_risk"] - informal["net_after_tax_and_risk"],
        "disclaimer": "Ma'lumot uchun; yakuniy qarordan oldin soliq maslahatchisi bilan tekshiring.",
    }
