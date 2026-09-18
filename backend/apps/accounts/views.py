from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "role", "lang", "points", "reputation", "telegram_id")


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}


@api_view(["POST"])
@permission_classes([AllowAny])
def demo_login(request):
    role = request.data.get("role") or "entrepreneur"
    mapping = {
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
