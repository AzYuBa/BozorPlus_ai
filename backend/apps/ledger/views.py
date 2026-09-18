from datetime import date, timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.ai.services.extract import extract_ledger_rule_based
from apps.catalog.models import Product
from .models import Business, LedgerEntry


def _business_for(user) -> Business | None:
    if user and getattr(user, "is_authenticated", False):
        return user.businesses.first()
    return Business.objects.filter(name__icontains="Dilshod").first() or Business.objects.first()


@api_view(["POST"])
@permission_classes([AllowAny])
def voice_entry(request):
    text = request.data.get("text") or ""
    parsed = extract_ledger_rule_based(
        text,
        list(Product.objects.values("id", "slug", "name_uz", "name_ru", "aliases", "base_unit", "typical_pack_qty")),
    )
    biz = _business_for(request.user)
    if not biz:
        return Response({"detail": "Biznes topilmadi", "parsed": parsed}, status=400)
    product = None
    if parsed.get("product_slug"):
        product = Product.objects.filter(slug=parsed["product_slug"]).first()
    entry = LedgerEntry.objects.create(
        business=biz,
        type=parsed.get("type") or "expense",
        amount=parsed.get("amount") or 0,
        category=parsed.get("category") or "",
        product=product,
        qty=parsed.get("qty"),
        source=LedgerEntry.Source.VOICE if request.data.get("voice") else LedgerEntry.Source.TEXT,
        raw_text=text,
        confirmed=False,
        date=date.today(),
    )
    return Response(
        {
            "id": entry.id,
            "parsed": parsed,
            "message": f"{'Kirim' if entry.type=='income' else 'Chiqim'}: {entry.amount:,} so'm. Tasdiqlaysizmi?",
            "source": "ovozli daftar",
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def confirm_entry(request, pk: int):
    e = LedgerEntry.objects.filter(pk=pk).first()
    if not e:
        return Response(status=404)
    e.confirmed = bool(request.data.get("ok", True))
    e.save(update_fields=["confirmed"])
    return Response({"id": e.id, "confirmed": e.confirmed})


@api_view(["GET"])
@permission_classes([AllowAny])
def report(request):
    period = request.query_params.get("period") or "month"
    biz = _business_for(request.user)
    if not biz:
        return Response({"detail": "Biznes yo'q"}, status=404)
    today = date.today()
    if period == "today":
        start = today
    elif period == "week":
        start = today - timedelta(days=7)
    else:
        start = today.replace(day=1)
    qs = biz.entries.filter(confirmed=True, date__gte=start)
    income = qs.filter(type="income").aggregate(s=Sum("amount"))["s"] or 0
    expense = qs.filter(type="expense").aggregate(s=Sum("amount"))["s"] or 0
    daily = []
    d = start
    while d <= today:
        i = qs.filter(type="income", date=d).aggregate(s=Sum("amount"))["s"] or 0
        e = qs.filter(type="expense", date=d).aggregate(s=Sum("amount"))["s"] or 0
        daily.append({"date": str(d), "income": i, "expense": e, "net": i - e})
        d += timedelta(days=1)
    latest = [
        {
            "id": x.id,
            "type": x.type,
            "amount": x.amount,
            "category": x.category,
            "date": str(x.date),
            "raw_text": x.raw_text,
            "confirmed": x.confirmed,
        }
        for x in biz.entries.all()[:30]
    ]
    return Response(
        {
            "business": biz.name,
            "period": period,
            "income": income,
            "expense": expense,
            "net": income - expense,
            "daily": daily[-31:],
            "entries": latest,
            "source": "ovozli daftar",
        }
    )
