from datetime import date, timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.ledger.models import Business, LedgerEntry
from .models import BusinessPlan, CreditPackage, CreditReadiness, StressTestRun
from .planning import credit_readiness_score


def _kti_for_business(biz: Business) -> dict:
    plan = biz.plans.first()
    last_stress = StressTestRun.objects.filter(plan__business=biz).order_by("-created_at").first()
    start = date.today() - timedelta(days=60)
    days = (
        LedgerEntry.objects.filter(business=biz, confirmed=True, date__gte=start)
        .values_list("date", flat=True)
        .distinct()
        .count()
    )
    out = (plan.outputs if plan else {}) or {}
    rev = out.get("revenue_month") or biz.monthly_revenue or 1
    net = out.get("net_month") or 0
    margin = net / rev if rev else 0
    p_loss = last_stress.p_loss if last_stress else 0.2
    loan_pmt = int((plan.inputs if plan else {}).get("loan_payment") or 8_000_000)
    dscr = (net + loan_pmt) / loan_pmt if loan_pmt else 2
    result = credit_readiness_score(
        has_plan=bool(plan),
        has_ledger_report=biz.entries.filter(confirmed=True).exists(),
        legal_status=biz.legal_status,
        ledger_days_60=days,
        profit_margin=margin,
        p_loss=p_loss,
        dscr=dscr,
    )
    obj, _ = CreditReadiness.objects.update_or_create(
        business=biz,
        defaults={
            "score": result["score"],
            "factors": result["factors"],
            "recommendations": result["recommendations"],
        },
    )
    result["id"] = obj.id
    result["business"] = biz.name
    result["legal_status"] = biz.legal_status
    return result


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def credit_readiness(request, business_id: int):
    biz = Business.objects.filter(pk=business_id).first() or Business.objects.filter(name__icontains="Dilshod").first()
    if not biz:
        return Response(status=404)
    return Response(_kti_for_business(biz))


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def credit_package(request):
    biz = Business.objects.filter(name__icontains="Dilshod").first() or Business.objects.first()
    if request.method == "GET":
        packs = CreditPackage.objects.select_related("business").order_by("-created_at")[:20]
        return Response(
            [
                {
                    "id": p.id,
                    "business": p.business.name,
                    "consent": p.consent,
                    "sent_to_bank_at": p.sent_to_bank_at,
                    "summary": p.summary,
                    "created_at": p.created_at,
                }
                for p in packs
            ]
        )
    if not biz:
        return Response({"detail": "Biznes yo'q"}, status=400)
    plan = biz.plans.first()
    kti = _kti_for_business(biz)
    consent = bool(request.data.get("consent"))
    send = bool(request.data.get("send"))
    if send and not consent:
        return Response({"detail": "Rozilik belgilanmasa yuborilmaydi"}, status=400)
    summary = {
        "kti": kti["score"],
        "plan_id": plan.id if plan else None,
        "npv": (plan.outputs or {}).get("npv") if plan else None,
        "payback": (plan.outputs or {}).get("payback_months") if plan else None,
        "disclaimer": kti.get("disclaimer"),
    }
    pack = CreditPackage.objects.create(
        business=biz,
        plan=plan,
        summary=summary,
        consent=consent,
        created_by=request.user if request.user.is_authenticated else biz.owner,
        sent_to_bank_at=timezone.now() if send and consent else None,
    )
    return Response(
        {
            "id": pack.id,
            "summary": summary,
            "consent": pack.consent,
            "sent_to_bank_at": pack.sent_to_bank_at,
            "bank_inbox": bool(pack.sent_to_bank_at),
            "source": "kredit paketi",
        }
    )
