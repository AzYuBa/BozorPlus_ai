import base64
import json

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import LLMCallLog
from .openai_agent import run_gpt, transcribe_audio
from .tools import route_message


def _history(request):
    raw = request.data.get("history")
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _image_data_url(request):
    f = request.FILES.get("image") or request.FILES.get("file")
    if not f:
        b64 = request.data.get("image_base64")
        if b64:
            mime = request.data.get("image_mime") or "image/jpeg"
            return f"data:{mime};base64,{b64}"
        return None
    raw = f.read()
    if len(raw) > 6_000_000:
        return None
    mime = f.content_type or "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")


def _audio_text(request):
    f = request.FILES.get("audio") or request.FILES.get("voice")
    if not f:
        return ""
    raw = f.read()
    if not raw:
        return ""
    try:
        return transcribe_audio(raw, f.name or "audio.webm")
    except Exception:
        return ""


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def chat(request):
    text = (request.data.get("message") or request.data.get("text") or "").strip()
    spoken = _audio_text(request)
    if spoken:
        text = f"{text} {spoken}".strip() if text else spoken
    image = _image_data_url(request)
    if not text and not image:
        return Response({"detail": "Matn, ovoz yoki rasm yuboring"}, status=400)
    if not text:
        text = "Shu rasmni tahlil qil. Narx, chek yoki biznes ma'lumoti bo'lsa tegishli bo'limga yoz."

    try:
        result = run_gpt(text, _history(request), image)
    except Exception:
        result = route_message(text)
        result["source"] = "zaxira tool router"

    LLMCallLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        model=result.get("model") or "xorazmiy",
        tools=result.get("tools") or [],
        prompt_preview=text[:240],
        latency_ms=int(result.get("latency_ms") or 0),
    )
    result["transcript"] = spoken or None
    return Response(result)
