from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import BusinessProfile, ForwarderProfile, User
from .serializers import LoginSerializer, MeSerializer, RegisterSerializer


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": MeSerializer(user).data,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    ser = RegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user = ser.save()
    return Response(tokens_for(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    ser = LoginSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    email = ser.validated_data["email"].strip().lower()
    user = authenticate(request, username=email, password=ser.validated_data["password"])
    if not user:
        return Response(
            {"error": {"code": 401, "message": "Email yoki parol noto'g'ri", "fieldErrors": {}}},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response(tokens_for(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh = request.data.get("refresh")
    if not refresh:
        return Response(
            {"error": {"code": 400, "message": "refresh token kerak", "fieldErrors": {"refresh": ["Majburiy"]}}},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        token = RefreshToken(refresh)
        token.blacklist()
    except Exception:
        return Response(
            {"error": {"code": 400, "message": "Token yaroqsiz", "fieldErrors": {}}},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({"ok": True})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "GET":
        return Response(MeSerializer(request.user).data)

    user = request.user
    full_name = request.data.get("full_name")
    phone = request.data.get("phone")
    if full_name is not None:
        user.full_name = str(full_name).strip()
    if phone is not None:
        user.phone = str(phone).strip()
    user.save()

    if user.role == User.Role.BUSINESS:
        biz = request.data.get("business")
        if isinstance(biz, dict):
            profile, _ = BusinessProfile.objects.get_or_create(user=user)
            for key in ("business_name", "region", "activity", "market"):
                if key in biz:
                    setattr(profile, key, str(biz.get(key) or "").strip())
            profile.save()
    elif user.role == User.Role.FORWARDER:
        fwd = request.data.get("forwarder")
        if isinstance(fwd, dict):
            profile, _ = ForwarderProfile.objects.get_or_create(user=user)
            for key in ("vehicle", "capacity", "region"):
                if key in fwd:
                    setattr(profile, key, str(fwd.get(key) or "").strip())
            profile.save()

    user.refresh_from_db()
    return Response(MeSerializer(user).data)
