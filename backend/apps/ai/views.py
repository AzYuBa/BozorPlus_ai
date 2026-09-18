from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import LLMCallLog
from .tools import route_message


@api_view(["POST"])
@permission_classes([AllowAny])
def chat(request):
    text = request.data.get("message") or request.data.get("text") or ""
    result = route_message(text)
    LLMCallLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        model="xorazmiy-tools-v0",
        tools=result.get("tools") or [],
        prompt_preview=text[:240],
        latency_ms=0,
    )
    return Response(result)
