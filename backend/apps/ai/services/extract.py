from __future__ import annotations

import json
import os
import re
from decimal import Decimal
from typing import Any

from django.conf import settings

from .units import parse_quantity, parse_uz_number, to_base_unit_price


LEDGER_INCOME = ("sotdim", "sotuv", "kirim", "oldim pul", "tushum")
LEDGER_EXPENSE = ("to'ladim", "toladim", "chiqim", "xarid", "oldim", "ijara", "ish haqi", "maosh")


def _normalize_text(text: str) -> str:
    t = (text or "").lower()
    t = t.replace("ё", "e").replace("‘", "'").replace("’", "'").replace("ʻ", "'")
    t = t.replace("g'osh", "go'sh").replace("gosht", "go'sht")
    return t


def extract_price_rule_based(text: str, products: list[dict] | None = None) -> dict[str, Any]:
    """Deterministic extractor used as primary MVP path + LLM fallback."""
    raw = text or ""
    t = _normalize_text(raw)
    amount = parse_uz_number(t)
    qty, unit = parse_quantity(t)

    # "50 kglik qop un 450 ming" — qty is 50 kg in one sack, amount is for the sack
    pack = re.search(r"(\d+(?:[.,]\d+)?)\s*kg(?:lik)?\s*(qop|мешок)", t)
    if pack and amount:
        qty = Decimal(pack.group(1).replace(",", "."))
        unit = "kg"

    product_hit = match_product_name(t, products or [])
    market_hit = None
    for token, name in (("urganch", "Urganch"), ("xiva", "Xiva"), ("gurlan", "Gurlan"), ("shovot", "Shovot")):
        if token in t:
            market_hit = name
            break

    per = None
    qty_base = qty
    if amount is not None:
        pack_kg = Decimal(str((product_hit or {}).get("typical_pack_qty") or 50))
        per, qty_base, unit = to_base_unit_price(amount, qty, unit, pack_kg=pack_kg)

    confidence = 0.5
    if product_hit and amount:
        confidence = 0.86
    if product_hit and amount and qty:
        confidence = 0.93
    if "go'sht" in t and "mol" not in t and "qo'y" not in t and "tovuq" not in t:
        confidence = min(confidence, 0.55)

    needs_clarify = None
    if "go'sht" in t and not any(x in t for x in ("mol", "qo'y", "tovuq", "qoy", "gov")):
        needs_clarify = "Mol go'shtimi yoki qo'y go'shtimi?"

    return {
        "intent": "price",
        "product_slug": (product_hit or {}).get("slug"),
        "product_name": (product_hit or {}).get("name_uz"),
        "price_per_base_unit": per,
        "total": amount,
        "qty": float(qty_base) if qty_base is not None else None,
        "unit": unit or (product_hit or {}).get("base_unit") or "kg",
        "market_hint": market_hit,
        "confidence": confidence,
        "needs_clarify": needs_clarify,
        "raw_text": raw,
        "source": "rules",
    }


def extract_ledger_rule_based(text: str, products: list[dict] | None = None) -> dict[str, Any]:
    t = _normalize_text(text)
    amount = parse_uz_number(t)
    qty, unit = parse_quantity(t)
    product_hit = match_product_name(t, products or [])
    entry_type = "income" if any(k in t for k in LEDGER_INCOME) else "expense"
    if "sotdim" in t:
        entry_type = "income"
        if qty and amount and unit == "qop":
            amount = int(Decimal(amount) * qty)
            qty = qty  # keep
        elif qty and "qop" in t and amount:
            # "3 qop guruch qopi 450 mingdan" → 3 * 450_000
            amount = int(Decimal(amount) * qty)
    category = "sotuv" if entry_type == "income" else "xarid"
    if "ijara" in t:
        category = "ijara"
        entry_type = "expense"
    if "maosh" in t or "ish haqi" in t:
        category = "ish_haqi"
        entry_type = "expense"
    return {
        "intent": "ledger",
        "type": entry_type,
        "amount": amount,
        "category": category,
        "product_slug": (product_hit or {}).get("slug"),
        "qty": float(qty) if qty is not None else None,
        "unit": unit,
        "confidence": 0.85 if amount else 0.4,
        "raw_text": text,
        "source": "rules",
    }


def match_product_name(text: str, products: list[dict]) -> dict | None:
    t = _normalize_text(text)
    best = None
    best_score = 0
    for p in products:
        names = [p.get("name_uz", ""), p.get("name_ru", ""), p.get("slug", "")] + list(p.get("aliases") or [])
        for n in names:
            if not n:
                continue
            nn = _normalize_text(str(n))
            if nn and nn in t:
                score = len(nn)
                if score > best_score:
                    best_score = score
                    best = p
    if best:
        return best
    try:
        from rapidfuzz import fuzz
    except Exception:
        return None
    for p in products:
        names = [p.get("name_uz", ""), p.get("name_ru", "")] + list(p.get("aliases") or [])
        for n in names:
            if not n:
                continue
            score = fuzz.partial_ratio(_normalize_text(str(n)), t)
            if score > best_score and score >= 80:
                best_score = score
                best = p
    return best


def llm_extract(text: str) -> dict | None:
    api_key = getattr(settings, "LITELLM_API_KEY", "") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from litellm import completion
    except Exception:
        return None
    prompt = (
        "Matndan JSON ajrat: product, price_total (so'm, butun son), qty, unit, market, intent (price|ledger). "
        "Faqat JSON qaytar.\nMatn: "
        + text
    )
    try:
        resp = completion(
            model=getattr(settings, "LITELLM_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
            api_key=api_key,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content
        return json.loads(content)
    except Exception:
        return None
