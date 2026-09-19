"""OpenAI Biznes-Adviser — kalit faqat backend/.env da."""
from __future__ import annotations

import os
from typing import Any

from openai import OpenAI

from apps.market.services import ensure_instruments, instrument_payload
from apps.market.models import MarketInstrument


SYSTEM_PROMPT = """Siz Bozor-Puls.Ai platformasidagi AI Biznes-Advisersiz.
O'zbek tadbirkorlari va ekspeditorlarga qisqa, amaliy maslahat bering.
Til: o'zbek (lotin). Kerak bo'lsa sodda raqamlar bilan tushuntiring.
Kontekstda berilgan mahsulot narxlari Yahoo futures + mahalliy UZS proxy ekanini yodingizda tuting —
bu kafolatlangan bozor narxi emas.
To'lov, kredit yoki qonuniy maslahatda ehtiyotkor bo'ling: umumiy yo'nalish bering, kafolat bermang.
Javoblar qisqa (2–6 gap), ro'yxat bo'lishi mumkin.
"""


def _market_context() -> str:
    try:
        ensure_instruments()
        lines = []
        for inst in MarketInstrument.objects.filter(is_active=True).order_by("name_uz")[:12]:
            p = instrument_payload(inst)
            lines.append(
                f"- {p['name']}: {p['price']} so'm/{p['unit']} "
                f"({p['change_pct']:+.2f}%, {p['yahoo_symbol']}, {p['as_of'] or 'seed'})"
            )
        if not lines:
            return "Bozor ma'lumoti hozircha yo'q."
        return "Joriy proxy narxlar:\n" + "\n".join(lines)
    except Exception as exc:
        return f"Bozor konteksti olinmadi: {exc}"


def chat(message: str, history: list[dict[str, str]] | None = None) -> dict[str, Any]:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY sozlanmagan (backend/.env)")

    model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()
    client = OpenAI(api_key=api_key)

    messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + _market_context()},
    ]
    for item in (history or [])[-8:]:
        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content[:4000]})
    messages.append({"role": "user", "content": message.strip()[:4000]})

    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.4,
        max_tokens=800,
    )
    reply = (resp.choices[0].message.content or "").strip()
    return {
        "reply": reply,
        "model": model,
        "usage": {
            "prompt_tokens": getattr(resp.usage, "prompt_tokens", None),
            "completion_tokens": getattr(resp.usage, "completion_tokens", None),
        },
    }
