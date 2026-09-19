from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import services


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def status_view(request):
    import os

    configured = bool((os.getenv("OPENAI_API_KEY") or "").strip())
    return Response(
        {
            "configured": configured,
            "model": os.getenv("OPENAI_MODEL") or "gpt-4o-mini",
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat(request):
    message = (request.data.get("message") or "").strip()
    if not message:
        return Response(
            {"error": {"code": 400, "message": "Xabar bo'sh", "fieldErrors": {"message": ["Majburiy"]}}},
            status=status.HTTP_400_BAD_REQUEST,
        )
    history = request.data.get("history") or []
    if not isinstance(history, list):
        history = []
    try:
        result = services.chat(message, history)
        return Response(result)
    except RuntimeError as exc:
        return Response(
            {"error": {"code": 503, "message": str(exc), "fieldErrors": {}}},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as exc:
        return Response(
            {
                "error": {
                    "code": 502,
                    "message": "AI javob bermadi",
                    "fieldErrors": {},
                    "detail": str(exc),
                }
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )
