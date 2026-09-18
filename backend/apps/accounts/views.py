from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.ledger.models import Business

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    district_slug = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    market_slug = serializers.SerializerMethodField()
    market_name = serializers.SerializerMethodField()
    business = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "phone",
            "role",
            "lang",
            "points",
            "reputation",
            "telegram_id",
            "gender",
            "birth_year",
            "stir",
            "district_slug",
            "district_name",
            "market_slug",
            "market_name",
            "business",
        )

    def get_district_slug(self, obj):
        return obj.district.slug if obj.district_id else None

    def get_district_name(self, obj):
        return obj.district.name_uz if obj.district_id else None

    def get_market_slug(self, obj):
        return obj.market.slug if obj.market_id else None

    def get_market_name(self, obj):
        return obj.market.name_uz if obj.market_id else None

    def get_business(self, obj):
        biz = obj.businesses.first()
        if not biz:
            return None
        return {
            "name": biz.name,
            "sector": biz.sector,
            "legal_status": biz.legal_status,
            "tax_regime": biz.tax_regime,
            "employees": biz.employees,
            "monthly_revenue": biz.monthly_revenue,
        }


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}


def _unique_username(base: str) -> str:
    username = base
    n = 1
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{base}{n}"
    return username


def _int_or_none(value, lo=None, hi=None):
    if value in (None, ""):
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    if lo is not None and n < lo:
        return None
    if hi is not None and n > hi:
        return None
    return n


@api_view(["POST"])
@permission_classes([AllowAny])
def demo_login(request):
    role = request.data.get("role") or "entrepreneur"
    mapping = {
        "buyer": "xaridor",
        "entrepreneur": "dilshod",
        "supplier": "seller",
        "market_admin": "market_admin",
        "bank": "banker",
        "admin": "admin",
    }
    username = request.data.get("username") or mapping.get(role, "dilshod")
    user = User.objects.filter(username=username).first()
    if not user:
        return Response({"detail": "Avval seed_demo ishga tushiring"}, status=400)
    return Response(tokens_for(user))


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    from django.utils import timezone

    from apps.markets.models import District, Market

    role = request.data.get("role") or ""
    if role not in (User.Role.BUYER, User.Role.ENTREPRENEUR):
        return Response({"detail": "Rol: xaridor yoki tadbirkor"}, status=400)
    if not request.data.get("consent"):
        return Response({"detail": "Davom etish uchun rozilik kerak"}, status=400)

    name = (request.data.get("first_name") or request.data.get("name") or "").strip()
    lang = request.data.get("lang") or "uz"
    phone = (request.data.get("phone") or "").strip()
    district = None
    slug = request.data.get("district") or request.data.get("district_slug")
    if slug:
        district = District.objects.filter(slug=slug).first()

    gender = ""
    birth_year = None
    stir = ""
    market = None
    if role == User.Role.ENTREPRENEUR:
        gender = (request.data.get("gender") or "").strip()
        if gender not in User.Gender.values:
            gender = ""
        birth_year = _int_or_none(request.data.get("birth_year"), 1940, 2015)
        stir = (request.data.get("stir") or "").strip()[:14]
        mslug = request.data.get("market") or request.data.get("market_slug")
        if mslug:
            market = Market.objects.filter(slug=mslug).first()

    base = "xaridor" if role == User.Role.BUYER else "tadbirkor"
    user = User.objects.create(
        username=_unique_username(base),
        first_name=name[:150],
        phone=phone,
        role=role,
        lang=lang,
        district=district,
        market=market,
        gender=gender,
        birth_year=birth_year,
        stir=stir,
        consent_at=timezone.now(),
    )
    user.set_password(request.data.get("password") or "bozorpuls")
    user.save()

    if role == User.Role.ENTREPRENEUR:
        legal = request.data.get("legal_status") or ""
        if legal not in Business.LegalStatus.values:
            legal = Business.LegalStatus.INFORMAL
        biz_name = (request.data.get("business_name") or "").strip()
        if not biz_name:
            biz_name = f"{name} biznesi" if name else "Mening biznesim"
        Business.objects.create(
            owner=user,
            name=biz_name,
            sector=(request.data.get("sector") or "").strip(),
            district=district,
            legal_status=legal,
            tax_regime=(request.data.get("tax_regime") or "").strip(),
            monthly_revenue=_int_or_none(request.data.get("monthly_revenue"), 0) or 0,
            employees=_int_or_none(request.data.get("employees"), 0) or 0,
        )
    return Response(tokens_for(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def telegram_login(request):
    tid = request.data.get("telegram_id")
    if not tid:
        return Response({"detail": "telegram_id kerak"}, status=400)
    user, created = User.objects.get_or_create(
        telegram_id=tid,
        defaults={
            "username": f"tg_{tid}",
            "role": request.data.get("role") or User.Role.ENTREPRENEUR,
            "lang": request.data.get("lang") or "uz",
            "first_name": request.data.get("first_name") or "",
        },
    )
    if request.data.get("consent"):
        from django.utils import timezone

        if not user.consent_at:
            user.consent_at = timezone.now()
            user.save(update_fields=["consent_at"])
    return Response(tokens_for(user), status=status.HTTP_201_CREATED if created else 200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)
