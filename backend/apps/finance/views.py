from datetime import date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import Product
from apps.ledger.models import Business, LedgerEntry
from apps.prices.models import PriceDaily
from .calculators import loan_summary
from .models import BusinessPlan, CreditPackage, CreditReadiness, LoanProgram, StressTestRun, TaxRule
from .planning import build_plan, credit_readiness_score, monte_carlo
from .tax import formalization_compare, tax_burden


@api_view(["POST"])
@permission_classes([AllowAny])
def loan_calc(request):
    amount = int(request.data.get("amount") or 0)
    rate = float(request.data.get("rate") or 0.218)
    if rate > 1:
        rate = rate / 100.0
    months = int(request.data.get("months") or 24)
    kind = request.data.get("type") or "annuity"
    grace = int(request.data.get("grace") or 0)
    subsidy = float(request.data.get("subsidy") or 0)
    if subsidy > 1:
        subsidy = subsidy / 100.0
    result = loan_summary(amount, rate, months, kind, grace, subsidy)
    income = int(request.data.get("monthly_income") or 0)
    if income:
        dti = result["monthly_payment"] / income
        result["dti"] = round(dti, 3)
        result["dti_pct"] = round(dti * 100, 1)
        result["dti_ok"] = dti <= 0.4
    # with vs without subsidy comparison
    if subsidy:
        result["without_subsidy"] = loan_summary(amount, rate if request.data.get("rate") else 0.218, months, kind, grace, 0)
        raw_rate = float(request.data.get("rate") or 0.218)
        if raw_rate > 1:
            raw_rate /= 100
        result["without_subsidy"] = loan_summary(amount, raw_rate, months, kind, grace, 0)
    result["disclaimer"] = "Ma'lumot uchun; yakuniy qarordan oldin bank bilan tekshiring."
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def programs_match(request):
    sector = request.query_params.get("sector") or "ovqatlanish"
    amount = int(request.query_params.get("amount") or 150_000_000)
    legal = request.query_params.get("legal_status") or "informal"
    gender = request.query_params.get("gender") or "male"
    today = date.today()
    out = []
    for p in LoanProgram.objects.filter(is_active=True):
        if p.valid_from and p.valid_from > today:
            continue
        if p.valid_to and p.valid_to < today:
            continue
        elig = p.eligibility or {}
        reasons = []
        ok = True
        if elig.get("max_amount") and amount > p.max_amount:
            ok = False
            reasons.append("Summa dastur limitidan oshadi")
        if elig.get("gender") == "female" and gender != "female":
            ok = False
            reasons.append("Dastur ayollar tadbirkorligiga mo'ljallangan")
        else:
            reasons.append("Summa va muddat mos")
        if elig.get("legal_min") == "yatt" and legal in ("informal",):
            reasons.append("Rasmiy maqom talab qilinishi mumkin")
        if amount <= p.max_amount:
            reasons.append(f"Maksimal {p.max_amount:,} so'm gacha")
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "provider": p.provider,
                "rate": float(p.rate),
                "max_amount": p.max_amount,
                "term_months": p.term_months,
                "grace_months": p.grace_months,
                "collateral": p.collateral,
                "guarantee_pct": float(p.guarantee_pct),
                "subsidy_rule": p.subsidy_rule,
                "legal_ref_url": p.legal_ref_url,
                "eligible": ok,
                "reasons": reasons,
                "source": p.legal_ref_url or "LoanProgram",
            }
        )
    out.sort(key=lambda x: (not x["eligible"], x["rate"]))
    return Response(out)


@api_view(["POST"])
@permission_classes([AllowAny])
def tax_compare(request):
    turnover = int(request.data.get("turnover") or 0)
    expenses = int(request.data.get("expenses") or 0)
    sector = request.data.get("sector") or "savdo"
    rules = list(
        TaxRule.objects.filter(is_active=True).values(
            "regime", "rate", "base", "threshold_min", "threshold_max", "sector_filter", "valid_from", "valid_to", "legal_ref_url", "note"
        )
    )
    rows = tax_burden(turnover, expenses, sector, rules)
    warnings = []
    if turnover >= 1_000_000_000:
        warnings.append("Yillik aylanma 1 mlrd so'mdan oshdi — QQS rejimiga yaqinlashyapsiz.")
    if turnover >= 4_940_000_000:
        warnings.append("QQS majburiy chegara (~4,94 mlrd so'm, 01.06.2026).")
    calendar = [
        {"when": "Har oy 15-sanagacha", "title": "YaTT aylanma solig'i to'lovi", "risk": "kechikish — penya"},
        {"when": "Har chorak", "title": "Hisobot (YaTT / MChJ)", "risk": "jarima"},
        {"when": "Har yil 1-fevralgacha", "title": "Yillik deklaratsiya", "risk": "tekshiruv"},
        {"when": "Aylanma 1 mlrd+", "title": "QQS hisobi va EHF nazorati", "risk": "qo'shimcha soliq"},
    ]
    return Response(
        {
            "turnover": turnover,
            "expenses": expenses,
            "rows": rows,
            "warnings": warnings,
            "calendar": calendar,
            "qqs_soft": 1_000_000_000,
            "qqs_hard": 4_940_000_000,
            "disclaimer": "Ma'lumot uchun; yakuniy qarordan oldin soliq maslahatchisi bilan tekshiring.",
            "source": "TaxRule / lex.uz",
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def status_compare(request):
    turnover = int(request.data.get("turnover") or 0)
    expenses = int(request.data.get("expenses") or 0)
    sector = request.data.get("sector") or "ovqatlanish"
    rules = list(
        TaxRule.objects.filter(is_active=True).values(
            "regime", "rate", "base", "threshold_min", "threshold_max", "sector_filter", "valid_from", "valid_to", "legal_ref_url", "note"
        )
    )
    return Response(formalization_compare(turnover, expenses, sector, rules))


def _price_snapshot(slugs: list[str]) -> dict:
    snap = {}
    for slug in slugs:
        p = Product.objects.filter(slug=slug).first()
        if not p:
            continue
        last = PriceDaily.objects.filter(product=p).order_by("-date").first()
        hist = list(PriceDaily.objects.filter(product=p).order_by("-date").values_list("close", flat=True)[:30])
        sigma = 0.08
        if len(hist) > 5:
            import numpy as np

            arr = np.array(hist, dtype=float)
            rets = np.diff(np.log(arr[::-1] + 1))
            sigma = float(np.std(rets)) if len(rets) else 0.08
        snap[slug] = {
            "price": last.close if last else 0,
            "date": str(last.date) if last else None,
            "name": p.name_uz,
            "sigma": min(0.35, max(0.03, sigma * (30 ** 0.5))),
            "source": f"BozorPuls narxi, {last.date if last else ''}",
        }
    return snap


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def plans(request):
    biz = Business.objects.filter(name__icontains="Dilshod").first() or Business.objects.first()
    if request.method == "GET":
        items = BusinessPlan.objects.filter(business=biz)[:10] if biz else []
        return Response(
            [
                {
                    "id": p.id,
                    "title": p.title,
                    "outputs": p.outputs,
                    "price_snapshot": p.price_snapshot,
                    "created_at": p.created_at,
                }
                for p in items
            ]
        )
    inputs = request.data.get("inputs") or request.data
    materials = inputs.get("materials") or {"un": 1500, "mol-gosht": 400, "piyoz": 200}
    snap = _price_snapshot(list(materials.keys()))
    outputs = build_plan({**inputs, "materials": materials}, snap)
    plan = BusinessPlan.objects.create(
        business=biz,
        title=inputs.get("title") or f"{biz.name if biz else 'Biznes'} reja",
        inputs={**inputs, "materials": materials},
        outputs=outputs,
        price_snapshot=snap,
    )
    return Response(
        {
            "id": plan.id,
            "title": plan.title,
            "inputs": plan.inputs,
            "outputs": outputs,
            "price_snapshot": snap,
            "source": "kalkulyator + BozorPuls narxi",
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def stress_test(request, pk: int):
    plan = BusinessPlan.objects.filter(pk=pk).first()
    if not plan:
        return Response(status=404)
    n = int(request.data.get("n") or 1000)
    out = plan.outputs or {}
    materials = out.get("materials") or []
    result = monte_carlo(
        monthly_revenue=out.get("revenue_month") or 0,
        monthly_fixed=out.get("fixed_cost_month") or 0,
        materials=materials,
        loan_payment=int((plan.inputs or {}).get("loan_payment") or 0),
        n=n,
    )
    run = StressTestRun.objects.create(
        plan=plan,
        n=n,
        p_loss=result["p_loss"],
        p10=result["p10"],
        p50=result["p50"],
        p90=result["p90"],
        top_risk_factor=result["top_risk_factor"],
        histogram=result["histogram"],
    )
    result["id"] = run.id
    result["disclaimer"] = "Ma'lumot uchun; bank o'z risk modelini qo'llaydi."
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def export_plan(request, pk: int):
    plan = BusinessPlan.objects.filter(pk=pk).first()
    if not plan:
        return Response(status=404)
    return Response(
        {
            "id": plan.id,
            "title": plan.title,
            "outputs": plan.outputs,
            "price_snapshot": plan.price_snapshot,
            "format": request.query_params.get("format") or "json",
            "source": "BozorPuls biznes-reja",
        }
    )
