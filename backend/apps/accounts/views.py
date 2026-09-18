from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    district_slug = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()

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
            "district_slug",
            "district_name",
        )

    def get_district_slug(self, obj):
        return obj.district.slug if obj.district_id else None

    def get_district_name(self, obj):
        return obj.district.name_uz if obj.district_id else None


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}


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

    from apps.markets.models import District

    role = request.data.get("role") or ""
    if role not in (User.Role.BUYER, User.Role.ENTREPRENEUR):
        return Response({"detail": "Rol: xaridor yoki tadbirkor"}, status=400)
    if not request.data.get("consent"):
        return Response({"detail": "Davom etish uchun rozilik kerak"}, status=400)
    name = (request.data.get("first_name") or request.data.get("name") or "").strip()
    if len(name) < 2:
        return Response({"detail": "Ism kiriting"}, status=400)
    lang = request.data.get("lang") or "uz"
    phone = (request.data.get("phone") or "").strip()
    district = None
    slug = request.data.get("district") or request.data.get("district_slug")
    if slug:
        district = District.objects.filter(slug=slug).first()
    base = "xaridor" if role == User.Role.BUYER else "tadbirkor"
    username = base
    n = 1
    while User.objects.filter(username=username).exists():
        n += 1
        username = f"{base}{n}"
    user = User.objects.create(
        username=username,
        first_name=name[:30],
        phone=phone,
        role=role,
        lang=lang,
        district=district,
        consent_at=timezone.now(),
    )
    user.set_password(request.data.get("password") or "bozorpuls")
    user.save()
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
