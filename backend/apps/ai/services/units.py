from __future__ import annotations

import re
from decimal import Decimal
from typing import Optional

PACK_DEFAULT_KG = Decimal("50")


def parse_uz_number(text: str) -> Optional[int]:
    """Parse spoken/written Uzbek/Russian som amounts into integer som."""
    if not text:
        return None
    t = text.lower().replace("ё", "e")
    t = t.replace("сум", " ").replace("so'm", " ").replace("som", " ").replace("so‘m", " ")
    t = re.sub(r"[’'`ʻ‘]", "'", t)
    t = re.sub(r"(\d)[ ]+(\d{3}\b)", r"\1\2", t)

    mln = r"(?:mln|million|млн|миллион)"
    ming = r"(?:ming|минг|тыс(?:яч)?)"

    m = re.search(rf"(\d+(?:[.,]\d+)?)\s*{mln}\s*(\d+(?:[.,]\d+)?)\s*{ming}", t)
    if m:
        return int(
            float(m.group(1).replace(",", ".")) * 1_000_000
            + float(m.group(2).replace(",", ".")) * 1_000
        )

    m = re.search(rf"(\d+(?:[.,]\d+)?)\s*{mln}\s*(\d+(?:[.,]\d+)?)", t)
    if m:
        a = float(m.group(1).replace(",", "."))
        b = float(m.group(2).replace(",", "."))
        if b < 1000:
            b *= 1000
        return int(a * 1_000_000 + b)

    m = re.search(rf"(\d+(?:[.,]\d+)?)\s*{mln}", t)
    if m:
        return int(float(m.group(1).replace(",", ".")) * 1_000_000)

    m = re.search(rf"(\d+(?:[.,]\d+)?)\s*{ming}", t)
    if m:
        return int(float(m.group(1).replace(",", ".")) * 1_000)

    nums = re.findall(r"\d[\d\s]*", t)
    if nums:
        raw = re.sub(r"\s+", "", nums[-1])
        if raw.isdigit():
            return int(raw)
    return None


def parse_quantity(text: str) -> tuple[Optional[Decimal], Optional[str]]:
    t = text.lower()
    if "yarim tonna" in t or "полтонн" in t:
        return Decimal("500"), "kg"
    if "yarim" in t and "tonna" in t:
        return Decimal("500"), "kg"

    pack = re.search(r"(\d+(?:[.,]\d+)?)\s*kg(?:lik)?\s*(qop|мешок)", t)
    if pack:
        return Decimal(pack.group(1).replace(",", ".")), "kg"

    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(tonna|t\b|тонна)", t)
    if m:
        return Decimal(m.group(1).replace(",", ".")) * 1000, "kg"

    m = re.search(r"(\d+(?:[.,]\d+)?)\s*kg(?:lik)?", t)
    if m:
        return Decimal(m.group(1).replace(",", ".")), "kg"

    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(kilosi|kilogram|кило)", t)
    if m:
        return Decimal(m.group(1).replace(",", ".")), "kg"

    m = re.search(r"(\d+)\s*talik", t)
    if m:
        return Decimal(m.group(1)), "dona"

    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(qop|мешок)", t)
    if m:
        return Decimal(m.group(1).replace(",", ".")), "qop"

    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(litr|литр|l\b)", t)
    if m:
        return Decimal(m.group(1).replace(",", ".")), "litr"

    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(dona|шт)", t)
    if m:
        return Decimal(m.group(1).replace(",", ".")), "dona"

    return None, None


def to_base_unit_price(
    total_som: int,
    qty: Optional[Decimal],
    unit: Optional[str],
    pack_kg: Decimal = PACK_DEFAULT_KG,
) -> tuple[int, Decimal, str]:
    if qty is None:
        qty = Decimal("1")
        unit = unit or "kg"
    if unit in ("qop", "мешок", "meshok"):
        qty_kg = qty * pack_kg
        unit = "kg"
    elif unit in ("tonna", "t", "тонна"):
        qty_kg = qty * Decimal("1000")
        unit = "kg"
    else:
        qty_kg = qty
        unit = unit or "kg"
    if qty_kg <= 0:
        qty_kg = Decimal("1")
    per = int(Decimal(total_som) / qty_kg)
    return per, qty_kg, unit
