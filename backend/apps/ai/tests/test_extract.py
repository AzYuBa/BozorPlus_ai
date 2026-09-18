from apps.ai.services.units import parse_uz_number, parse_quantity, to_base_unit_price
from apps.ai.services.extract import extract_price_rule_based, extract_ledger_rule_based
from decimal import Decimal


PRODUCTS = [
    {"slug": "un", "name_uz": "Un", "name_ru": "Мука", "aliases": ["мука"], "base_unit": "kg", "typical_pack_qty": 50},
    {"slug": "pomidor", "name_uz": "Pomidor", "name_ru": "Помидор", "aliases": ["помидор", "томат"], "base_unit": "kg", "typical_pack_qty": 1},
    {"slug": "kartoshka", "name_uz": "Kartoshka", "name_ru": "Картофель", "aliases": ["картошка"], "base_unit": "kg", "typical_pack_qty": 1},
    {"slug": "piyoz", "name_uz": "Piyoz", "name_ru": "Лук", "aliases": ["лук"], "base_unit": "kg", "typical_pack_qty": 1},
    {"slug": "tuxum", "name_uz": "Tuxum", "name_ru": "Яйцо", "aliases": ["яйцо"], "base_unit": "dona", "typical_pack_qty": 10},
    {"slug": "shakar", "name_uz": "Shakar", "name_ru": "Сахар", "aliases": ["сахар"], "base_unit": "kg", "typical_pack_qty": 50},
    {"slug": "guruch", "name_uz": "Guruch", "name_ru": "Рис", "aliases": ["рис"], "base_unit": "kg", "typical_pack_qty": 50},
]


def test_numbers():
    assert parse_uz_number("8 ming") == 8000
    assert parse_uz_number("450 ming") == 450_000
    assert parse_uz_number("6 mln 200") == 6_200_000
    assert parse_uz_number("1 mln 350 ming") == 1_350_000


def test_qop_un():
    r = extract_price_rule_based("50 kglik qop un 450 ming", PRODUCTS)
    assert r["product_slug"] == "un"
    assert r["price_per_base_unit"] == 9000


def test_pomidor():
    r = extract_price_rule_based("pomidor 8 ming", PRODUCTS)
    assert r["product_slug"] == "pomidor"
    assert r["price_per_base_unit"] == 8000


def test_urganch_kartoshka():
    r = extract_price_rule_based("Urganch bozorida kartoshka kilosi 4500", PRODUCTS)
    assert r["product_slug"] == "kartoshka"
    assert r["price_per_base_unit"] == 4500
    assert r["market_hint"] == "Urganch"


def test_luk():
    r = extract_price_rule_based("лук 3000 сум", PRODUCTS)
    assert r["product_slug"] == "piyoz"
    assert r["price_per_base_unit"] == 3000


def test_tuxum():
    r = extract_price_rule_based("tuxum 10 talik 16 ming", PRODUCTS)
    assert r["product_slug"] == "tuxum"
    assert r["qty"] == 10
    assert r["price_per_base_unit"] == 1600


def test_shakar_half_ton():
    r = extract_price_rule_based("yarim tonna shakar 6 mln 200", PRODUCTS)
    assert r["product_slug"] == "shakar"
    assert r["price_per_base_unit"] == 12400


def test_ledger_rice():
    r = extract_ledger_rule_based("bugun 3 qop guruch qopi 450 mingdan sotdim", PRODUCTS)
    assert r["type"] == "income"
    assert r["amount"] == 1_350_000


def test_ledger_rent():
    r = extract_ledger_rule_based("ijaraga 2 million to'ladim", PRODUCTS)
    assert r["type"] == "expense"
    assert r["amount"] == 2_000_000
    assert r["category"] == "ijara"
