from __future__ import annotations

import json
import time
from typing import Any

from django.conf import settings

from .tools import TOOLS, route_message

SYSTEM = """Sen BozorPuls AI (Xorazmiy) — O'zbekiston tadbirkorlari uchun moliyaviy va bozor maslahatchisisan.
O'zbek tilida sodda, qisqa va amaliy gapir.

Qoidalar:
- Narx, kredit, soliq, biznes-reja, daftar raqamlarini O'YLAB TOPMA. Avval mos tool chaqir.
- Rasm (fiskal chek, nakladnoy, narx yozuvi, biznes hujjati) kelsa: o'qi, tahlil qil, so'ng ingest_price yoki ledger_add yoki build_business_plan ga yoz.
- Ovoz matnga aylantirilgan bo'lishi mumkin — xuddi yozma buyruqdek bajar.
- Foydalanuvchini kerakli ekranga och_section orqali yo'naltir.
- O'rgat: tannarx, kassa oqimi, NPV, DTI, YaTT vs MChJ, kredit tayyorligi, xarid tejash.
- Har raqam yonida manba (BozorPuls, kalkulyator, lex.uz, DEMO).
- Yakunida: bu ma'lumot, bank/soliq qarori emas.
"""

OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_offers",
            "description": "Mahsulot bo'yicha eng arzon yetkazib beruvchilar (partiya xaridi).",
            "parameters": {
                "type": "object",
                "properties": {
                    "product": {"type": "string", "description": "slug: un, kartoshka, piyoz..."},
                    "qty": {"type": "number"},
                    "unit": {"type": "string"},
                    "district": {"type": "string"},
                },
                "required": ["product", "qty"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_price_stats",
            "description": "Mahsulot OHLC va bozorlar taqqosuvi.",
            "parameters": {
                "type": "object",
                "properties": {"product": {"type": "string"}, "days": {"type": "integer"}},
                "required": ["product"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "forecast_price",
            "description": "Narx prognozi va HOZIR OL/KUT signali.",
            "parameters": {
                "type": "object",
                "properties": {"product": {"type": "string"}, "horizon": {"type": "integer"}},
                "required": ["product"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ingest_price",
            "description": "Ovoz/matn/rasmdan o'qilgan narxni Bozor pulsiga kiritish.",
            "parameters": {
                "type": "object",
                "properties": {"text": {"type": "string"}},
                "required": ["text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "confirm_price",
            "description": "Kiritilgan narx kuzatuvini tasdiqlash.",
            "parameters": {
                "type": "object",
                "properties": {
                    "observation_id": {"type": "integer"},
                    "ok": {"type": "boolean"},
                },
                "required": ["observation_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ledger_add",
            "description": "Kirim/chiqimni ovozli daftarga yozish.",
            "parameters": {
                "type": "object",
                "properties": {"entry_text": {"type": "string"}},
                "required": ["entry_text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ledger_report",
            "description": "Daftar hisoboti.",
            "parameters": {"type": "object", "properties": {"period": {"type": "string"}}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calc_loan",
            "description": "Kredit kalkulyatori (anuitet/differensial).",
            "parameters": {
                "type": "object",
                "properties": {
                    "amount": {"type": "number"},
                    "rate": {"type": "number"},
                    "months": {"type": "integer"},
                    "type": {"type": "string"},
                    "grace": {"type": "integer"},
                    "subsidy": {"type": "number"},
                },
                "required": ["amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "match_programs",
            "description": "Bank imtiyozli dasturlarini moslashtirish.",
            "parameters": {
                "type": "object",
                "properties": {"amount": {"type": "number"}, "sector": {"type": "string"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calc_tax",
            "description": "Soliq rejimlarini taqqoslash.",
            "parameters": {
                "type": "object",
                "properties": {
                    "turnover": {"type": "number"},
                    "expenses": {"type": "number"},
                    "sector": {"type": "string"},
                },
                "required": ["turnover", "expenses"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compare_status",
            "description": "Norasmiy / o'zini o'zi band / YaTT taqqoslovi.",
            "parameters": {
                "type": "object",
                "properties": {
                    "turnover": {"type": "number"},
                    "expenses": {"type": "number"},
                    "sector": {"type": "string"},
                },
                "required": ["turnover"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "build_business_plan",
            "description": "Real narxlar asosida biznes-reja hisoblash.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "investment": {"type": "number"},
                    "employees": {"type": "integer"},
                    "units_month": {"type": "number"},
                    "sell_price": {"type": "number"},
                    "un": {"type": "number"},
                    "gosht": {"type": "number"},
                    "piyoz": {"type": "number"},
                    "loan_payment": {"type": "number"},
                    "sector": {"type": "string"},
                    "place": {"type": "string"},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "stress_test",
            "description": "Reja stress-testi.",
            "parameters": {
                "type": "object",
                "properties": {"plan_id": {"type": "integer"}, "n": {"type": "integer"}},
                "required": ["plan_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "credit_readiness",
            "description": "Kredit tayyorligi indeksi (KTI).",
            "parameters": {"type": "object", "properties": {"business_id": {"type": "integer"}}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_knowledge",
            "description": "Soliq/kredit qonunchilik bazasidan parcha.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "open_section",
            "description": "Foydalanuvchini platforma bo'limiga yo'naltirish.",
            "parameters": {
                "type": "object",
                "properties": {
                    "section": {
                        "type": "string",
                        "enum": [
                            "pulse",
                            "market",
                            "lot",
                            "arbitrage",
                            "plan",
                            "stress",
                            "credit",
                            "tax",
                            "package",
                            "ledger",
                            "profile",
                        ],
                    }
                },
                "required": ["section"],
            },
        },
    },
]


def _run_tool(name: str, args: dict) -> Any:
    args = args or {}
    if name == "search_offers":
        return TOOLS[name](
            product=args.get("product") or "un",
            qty=float(args.get("qty") or 500),
            unit=args.get("unit") or "kg",
            district=args.get("district") or "urganch-shahar",
        )
    if name == "get_price_stats":
        return TOOLS[name](args.get("product") or "un", days=int(args.get("days") or 90))
    if name == "forecast_price":
        return TOOLS[name](args.get("product") or "un")
    if name == "ingest_price":
        return TOOLS[name](args.get("text") or "")
    if name == "confirm_price":
        return TOOLS[name](int(args.get("observation_id") or 0), bool(args.get("ok", True)))
    if name == "ledger_add":
        return TOOLS[name](args.get("entry_text") or args.get("text") or "")
    if name == "ledger_report":
        return TOOLS[name](args.get("period") or "month")
    if name == "calc_loan":
        return TOOLS[name](
            int(args.get("amount") or 0),
            float(args.get("rate") or 0.175),
            int(args.get("months") or 36),
            args.get("type") or "annuity",
            int(args.get("grace") or 0),
            float(args.get("subsidy") or 0),
        )
    if name == "match_programs":
        return TOOLS[name]({"amount": args.get("amount") or 150000000, "sector": args.get("sector") or "ovqatlanish"})
    if name == "calc_tax":
        return TOOLS[name](int(args.get("turnover") or 0), int(args.get("expenses") or 0), args.get("sector") or "savdo")
    if name == "compare_status":
        return TOOLS[name](int(args.get("turnover") or 0), args.get("sector") or "ovqatlanish", int(args.get("expenses") or 0))
    if name == "build_business_plan":
        materials = {}
        if args.get("un") is not None:
            materials["un"] = args["un"]
        if args.get("gosht") is not None:
            materials["mol-gosht"] = args["gosht"]
        if args.get("piyoz") is not None:
            materials["piyoz"] = args["piyoz"]
        payload = {
            "title": args.get("title") or "Biznes-reja",
            "investment": int(args.get("investment") or 150_000_000),
            "employees": int(args.get("employees") or 4),
            "units_month": int(args.get("units_month") or 3000),
            "sell_price": int(args.get("sell_price") or 8000),
            "loan_payment": int(args.get("loan_payment") or 0),
            "sector": args.get("sector") or "ovqatlanish",
            "place": args.get("place") or "Urganch",
        }
        if materials:
            payload["materials"] = materials
        return TOOLS[name](payload)
    if name == "stress_test":
        return TOOLS[name](int(args.get("plan_id") or 0), int(args.get("n") or 1000))
    if name == "credit_readiness":
        return TOOLS[name](int(args.get("business_id") or 1))
    if name == "search_knowledge":
        return TOOLS[name](args.get("query") or "")
    if name == "open_section":
        return TOOLS[name](args.get("section") or "pulse")
    return {"detail": f"noma'lum tool: {name}"}


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    import tempfile
    from pathlib import Path

    from openai import OpenAI

    key = getattr(settings, "OPENAI_API_KEY", "") or getattr(settings, "LITELLM_API_KEY", "")
    if not key or not audio_bytes:
        return ""
    client = OpenAI(api_key=key)
    suffix = ".webm"
    if filename.endswith(".wav"):
        suffix = ".wav"
    elif filename.endswith(".mp3"):
        suffix = ".mp3"
    elif filename.endswith(".ogg"):
        suffix = ".ogg"
    elif filename.endswith(".m4a"):
        suffix = ".m4a"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        tmp.write(audio_bytes)
        tmp.close()
        with open(tmp.name, "rb") as fh:
            out = client.audio.transcriptions.create(model="whisper-1", file=fh)
        return (out.text or "").strip()
    finally:
        Path(tmp.name).unlink(missing_ok=True)


def run_gpt(message: str, history: list | None = None, image_data_url: str | None = None) -> dict:
    from openai import OpenAI

    key = getattr(settings, "OPENAI_API_KEY", "") or getattr(settings, "LITELLM_API_KEY", "")
    if not key:
        return route_message(message)

    client = OpenAI(api_key=key)
    model = getattr(settings, "OPENAI_MODEL", None) or "gpt-4o-mini"
    messages: list[dict] = [{"role": "system", "content": SYSTEM}]
    for h in (history or [])[-8:]:
        role = h.get("role")
        content = h.get("content") or h.get("text") or ""
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    user_content: Any = message or "Tahlil qil va kerakli bo'limga yoz."
    if image_data_url:
        user_content = [
            {"type": "text", "text": user_content},
            {"type": "image_url", "image_url": {"url": image_data_url}},
        ]
    messages.append({"role": "user", "content": user_content})

    used = []
    data: dict = {}
    actions = []
    t0 = time.time()
    last_error = None
    for candidate in (model, "gpt-4o-mini"):
        try:
            for _ in range(6):
                resp = client.chat.completions.create(
                    model=candidate,
                    messages=messages,
                    tools=OPENAI_TOOLS,
                    tool_choice="auto",
                    temperature=0.3,
                )
                choice = resp.choices[0]
                msg = choice.message
                if msg.tool_calls:
                    messages.append(
                        {
                            "role": "assistant",
                            "content": msg.content or "",
                            "tool_calls": [
                                {
                                    "id": tc.id,
                                    "type": "function",
                                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                                }
                                for tc in msg.tool_calls
                            ],
                        }
                    )
                    for tc in msg.tool_calls:
                        name = tc.function.name
                        try:
                            args = json.loads(tc.function.arguments or "{}")
                        except json.JSONDecodeError:
                            args = {}
                        used.append(name)
                        try:
                            result = _run_tool(name, args)
                        except Exception as exc:
                            result = {"error": str(exc)}
                        data[name] = result
                        if name == "open_section" and isinstance(result, dict) and result.get("route"):
                            actions.append({"type": "open", **result})
                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": json.dumps(result, ensure_ascii=False, default=str)[:8000],
                            }
                        )
                    continue
                reply = (msg.content or "").strip()
                return {
                    "reply": reply or "Tayyor.",
                    "tools": used,
                    "data": data,
                    "actions": actions,
                    "model": candidate,
                    "latency_ms": int((time.time() - t0) * 1000),
                    "disclaimer": True,
                    "source": "OpenAI + BozorPuls tools",
                }
            break
        except Exception as exc:
            last_error = exc
            continue

    fallback = route_message(message)
    fallback["tools"] = used or fallback.get("tools")
    fallback["data"] = {**(fallback.get("data") or {}), **data}
    fallback["actions"] = actions
    fallback["gpt_error"] = str(last_error) if last_error else "GPT javob bermadi"
    fallback["source"] = "zaxira tool router"
    return fallback
