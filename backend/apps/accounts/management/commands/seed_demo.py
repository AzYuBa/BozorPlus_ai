from datetime import date, timedelta
from decimal import Decimal
import math
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.ai.models import KnowledgeChunk
from apps.catalog.models import Category, Product
from apps.finance.models import LoanProgram, TaxRule
from apps.ledger.models import Business, LedgerEntry
from apps.markets.models import District, Market, Region
from apps.prices.models import PriceDaily, PriceObservation
from apps.sourcing.models import Offer, Supplier

User = get_user_model()

CATEGORIES = [
    ("don", "Don va un", "Зерно и мука"),
    ("gosht-sut", "Go'sht va sut", "Мясо и молоко"),
    ("sabzavot", "Sabzavot", "Овощи"),
    ("meva", "Meva", "Фрукты"),
    ("yog-shakar", "Yog' va shakar", "Масло и сахар"),
    ("boshqa", "Boshqa oziq-ovqat", "Прочее"),
]

PRODUCTS = [
    # slug, cat, uz, ru, aliases, unit, social, pack, base_price
    ("un", "don", "Un", "Мука", ["мука", "un-1-nav", "bug'doy uni", "мука пшеничная"], "kg", True, 50, 9000),
    ("un-1-nav", "don", "Un 1-nav", "Мука 1 сорт", ["1-nav un"], "kg", True, 50, 9500),
    ("guruch", "don", "Guruch", "Рис", ["рис", "shali"], "kg", True, 50, 14000),
    ("bugdoy", "don", "Bug'doy", "Пшеница", ["пшеница", "bugdoy"], "kg", False, 50, 3200),
    ("makaron", "don", "Makaron", "Макароны", ["макарон"], "kg", False, 1, 12000),
    ("non", "don", "Non", "Хлеб", ["хлеб", "patir"], "dona", True, 1, 3000),
    ("mol-gosht", "gosht-sut", "Mol go'shti", "Говядина", ["говядина", "mol", "gov go'sht", "go'sht"], "kg", True, 1, 95000),
    ("qoy-gosht", "gosht-sut", "Qo'y go'shti", "Баранина", ["баранина", "qoy"], "kg", True, 1, 105000),
    ("tovuq", "gosht-sut", "Tovuq", "Курица", ["курица", "товуқ"], "kg", True, 1, 28000),
    ("sut", "gosht-sut", "Sut", "Молоко", ["молоко"], "litr", True, 1, 9000),
    ("qatiq", "gosht-sut", "Qatiq", "Кефир", ["кефир", "yogurt"], "litr", False, 1, 8000),
    ("pishloq", "gosht-sut", "Pishloq", "Сыр", ["сыр"], "kg", False, 1, 65000),
    ("tuxum", "gosht-sut", "Tuxum", "Яйцо", ["яйцо", "яйца"], "dona", True, 10, 1600),
    ("sariyog", "gosht-sut", "Sariyog'", "Масло сливочное", ["сливочное масло"], "kg", False, 1, 85000),
    ("kartoshka", "sabzavot", "Kartoshka", "Картофель", ["картошка", "картофель"], "kg", True, 1, 4500),
    ("piyoz", "sabzavot", "Piyoz", "Лук", ["лук", "луковица"], "kg", True, 1, 3000),
    ("pomidor", "sabzavot", "Pomidor", "Помидор", ["помидор", "томат", "tomat"], "kg", True, 1, 8000),
    ("bodring", "sabzavot", "Bodring", "Огурец", ["огурец"], "kg", False, 1, 7000),
    ("sabzi", "sabzavot", "Sabzi", "Морковь", ["морковь"], "kg", True, 1, 4000),
    ("karam", "sabzavot", "Karam", "Капуста", ["капуста"], "kg", True, 1, 3500),
    ("sarimsoq", "sabzavot", "Sarimsoq", "Чеснок", ["чеснок"], "kg", False, 1, 25000),
    ("qalampir", "sabzavot", "Qalampir", "Перец", ["перец", "murch"], "kg", False, 1, 12000),
    ("baqlajon", "sabzavot", "Baqlajon", "Баклажан", ["баклажан"], "kg", False, 1, 9000),
    ("oshqovoq", "sabzavot", "Oshqovoq", "Тыква", ["тыква"], "kg", False, 1, 2500),
    ("loviya", "sabzavot", "Loviya", "Фасоль", ["фасоль"], "kg", False, 1, 18000),
    ("nohat", "sabzavot", "No'xat", "Горох", ["горох", "noxat"], "kg", False, 1, 16000),
    ("olma", "meva", "Olma", "Яблоко", ["яблоко"], "kg", False, 1, 12000),
    ("uzum", "meva", "Uzum", "Виноград", ["виноград"], "kg", False, 1, 15000),
    ("tarvuz", "meva", "Tarvuz", "Арбуз", ["арбуз"], "kg", False, 1, 2500),
    ("qovun", "meva", "Qovun", "Дыня", ["дыня"], "kg", False, 1, 4000),
    ("anor", "meva", "Anor", "Гранат", ["гранат"], "kg", False, 1, 18000),
    ("banan", "meva", "Banan", "Банан", ["банан"], "kg", False, 1, 22000),
    ("apelsin", "meva", "Apelsin", "Апельсин", ["апельсин"], "kg", False, 1, 20000),
    ("shaftoli", "meva", "Shaftoli", "Персик", ["персик"], "kg", False, 1, 16000),
    ("olcha", "meva", "Olcha", "Вишня", ["вишня"], "kg", False, 1, 25000),
    ("paxta-yog", "yog-shakar", "Paxta yog'i", "Хлопковое масло", ["масло", "yog'", "растительное масло"], "litr", True, 1, 16000),
    ("kungaboqar-yog", "yog-shakar", "Kungaboqar yog'i", "Подсолнечное масло", ["подсолнечное"], "litr", True, 1, 18000),
    ("shakar", "yog-shakar", "Shakar", "Сахар", ["сахар", "qand"], "kg", True, 50, 12400),
    ("tuz", "yog-shakar", "Tuz", "Соль", ["соль"], "kg", True, 1, 2500),
    ("choy", "boshqa", "Choy", "Чай", ["чай"], "kg", False, 1, 85000),
    ("qahva", "boshqa", "Qahva", "Кофе", ["кофе"], "kg", False, 1, 140000),
    ("suv", "boshqa", "Ichimlik suvi", "Вода", ["вода"], "litr", False, 1, 2000),
    ("gazli-ichimlik", "boshqa", "Gazli ichimlik", "Газировка", ["cola"], "litr", False, 1, 8000),
    ("sirka", "boshqa", "Sirka", "Уксус", ["уксус"], "litr", False, 1, 7000),
    ("zira", "boshqa", "Zira", "Зира", ["зира"], "kg", False, 1, 45000),
    ("murch", "boshqa", "Qora murch", "Перец чёрный", ["чёрный перец"], "kg", False, 1, 90000),
    ("qatiq-suzma", "gosht-sut", "Suzma", "Сузьма", ["сузьма"], "kg", False, 1, 22000),
    ("qazi", "gosht-sut", "Qazi", "Казы", ["казы"], "kg", False, 1, 110000),
    ("jigar", "gosht-sut", "Jigar", "Печень", ["печень"], "kg", False, 1, 55000),
    ("kartoshka-urug", "sabzavot", "Urug' kartoshka", "Семенной картофель", [], "kg", False, 1, 7000),
    ("ismaloq", "sabzavot", "Ismaloq", "Шпинат", ["шпинат"], "kg", False, 1, 8000),
    ("ukrop", "sabzavot", "Ukrop", "Укроп", ["укроп", "shivit"], "bog'", False, 1, 2000),
    ("kashnich", "sabzavot", "Kashnich", "Кинза", ["кинза"], "bog'", False, 1, 2000),
    ("olma-golden", "meva", "Olma Golden", "Голден", ["golden"], "kg", False, 1, 14000),
    ("nok", "meva", "Nok", "Груша", ["груша"], "kg", False, 1, 15000),
    ("xurmo", "meva", "Xurmo", "Хурма", ["хурма"], "kg", False, 1, 12000),
    ("asalar", "boshqa", "Asal", "Мёд", ["мёд", "asal"], "kg", False, 1, 85000),
    ("un-2-nav", "don", "Un 2-nav", "Мука 2 сорт", [], "kg", False, 50, 8000),
    ("grechka", "don", "Grechka", "Гречка", ["гречка"], "kg", False, 1, 18000),
    ("arpa", "don", "Arpa", "Ячмень", ["ячмень"], "kg", False, 1, 2800),
    ("makkajoxo'ri", "don", "Makkajo'xori", "Кукуруза", ["кукуруза", "makka"], "kg", False, 1, 3500),
    ("lavlagi", "sabzavot", "Lavlagi", "Свёкла", ["свекла"], "kg", True, 1, 4000),
]

DISTRICTS = [
    ("urganch-shahar", "Urganch shahri", True),
    ("urganch", "Urganch tumani", False),
    ("xiva", "Xiva", False),
    ("xonqa", "Xonqa", False),
    ("yangiariq", "Yangiariq", False),
    ("gurlan", "Gurlan", False),
    ("qoshkopir", "Qo'shko'pir", False),
    ("shovot", "Shovot", False),
    ("bogot", "Bog'ot", False),
    ("hazorasp", "Hazorasp", False),
    ("tuproqqala", "Tuproqqal'a", False),
    ("yangibozor", "Yangibozor", False),
]

MARKETS = [
    ("urganch-markaziy", "Urganch markaziy dehqon bozori", "urganch-shahar", "dehqon", 41.5504, 60.6314),
    ("urganch-ulgurji", "Urganch ulgurji bozori", "urganch-shahar", "ulgurji", 41.5610, 60.6100),
    ("xiva-dehqon", "Xiva dehqon bozori", "xiva", "dehqon", 41.3783, 60.3639),
    ("gurlan-bozor", "Gurlan bozori", "gurlan", "dehqon", 41.8447, 60.3900),
    ("shovot-bozor", "Shovot bozori", "shovot", "dehqon", 41.6550, 60.3020),
    ("hazorasp-bozor", "Hazorasp bozori", "hazorasp", "dehqon", 41.3190, 61.0740),
]


class Command(BaseCommand):
    help = "90 kunlik DEMO narx qatorlari, katalog, dasturlar va Dilshod aka biznesi"

    def handle(self, *args, **opts):
        random.seed(42)
        region, _ = Region.objects.get_or_create(
            slug="xorazm", defaults={"name_uz": "Xorazm viloyati", "name_ru": "Хорезмская область"}
        )
        districts = {}
        for slug, name, is_city in DISTRICTS:
            d, _ = District.objects.get_or_create(
                slug=slug, defaults={"region": region, "name_uz": name, "name_ru": name, "is_city": is_city}
            )
            districts[slug] = d

        markets = {}
        for slug, name, dslug, typ, lat, lng in MARKETS:
            m, _ = Market.objects.get_or_create(
                slug=slug,
                defaults={
                    "district": districts[dslug],
                    "name_uz": name,
                    "name_ru": name,
                    "type": typ,
                    "lat": lat,
                    "lng": lng,
                    "aliases": [name.split()[0]],
                },
            )
            markets[slug] = m

        cats = {}
        for i, (slug, uz, ru) in enumerate(CATEGORIES):
            c, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name_uz": uz, "name_ru": ru, "sort_order": i}
            )
            cats[slug] = c

        products = {}
        bases = {}
        for slug, cat, uz, ru, aliases, unit, social, pack, price in PRODUCTS:
            p, _ = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    "category": cats[cat],
                    "name_uz": uz,
                    "name_ru": ru,
                    "aliases": aliases,
                    "base_unit": unit,
                    "is_social": social,
                    "typical_pack_qty": pack,
                    "typical_pack_unit": "kg" if unit == "kg" else unit,
                    "demo": True,
                },
            )
            products[slug] = p
            bases[slug] = price

        # users
        def mk_user(username, role, first, district_slug, superuser=False):
            u, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "role": role,
                    "first_name": first,
                    "district": districts[district_slug],
                    "is_staff": superuser or role == "admin",
                    "is_superuser": superuser,
                    "consent_at": timezone.now(),
                    "reputation": Decimal("1.00"),
                },
            )
            if created:
                u.set_password("bozorpuls")
                u.save()
            return u

        admin = mk_user("admin", "admin", "Admin", "urganch-shahar", True)
        dilshod = mk_user("dilshod", "entrepreneur", "Dilshod aka", "urganch-shahar")
        seller = mk_user("seller", "supplier", "Hasan aka", "urganch-shahar")
        mk_user("market_admin", "market_admin", "Bozor ma'muri", "urganch-shahar")
        mk_user("banker", "bank", "Bank xodimi", "urganch-shahar")

        # 90 days OHLC
        today = date.today()
        market_bias = {
            "urganch-markaziy": 1.00,
            "urganch-ulgurji": 0.92,
            "xiva-dehqon": 1.04,
            "gurlan-bozor": 0.96,
            "shovot-bozor": 0.98,
            "hazorasp-bozor": 1.06,
        }
        if PriceDaily.objects.count() < 1000:
            rows = []
            for slug, p in products.items():
                base = bases[slug]
                phase = (hash(slug) % 100) / 100 * math.pi
                for mi, (mslug, market) in enumerate(markets.items()):
                    bias = market_bias[mslug]
                    for i in range(90):
                        d = today - timedelta(days=89 - i)
                        seas = 1 + 0.12 * math.sin(2 * math.pi * i / 365 + phase)
                        noise = 1 + random.uniform(-0.03, 0.03)
                        trend = 1 + 0.0008 * i * (1 if hash(slug) % 2 == 0 else -1)
                        close = int(base * bias * seas * noise * trend)
                        if slug == "un" and i >= 65:
                            close = int(8200 * bias + (i - 65) * 80 * bias)
                        spread = int(close * 0.025) + 50
                        open_ = close + random.randint(-spread, spread)
                        high = max(open_, close) + random.randint(0, spread)
                        low = min(open_, close) - random.randint(0, spread)
                        rows.append(
                            PriceDaily(
                                product=p,
                                market=market,
                                date=d,
                                open=open_,
                                high=high,
                                low=max(1, low),
                                close=close,
                                median=close,
                                n_obs=random.randint(3, 12),
                                is_demo=True,
                            )
                        )
            PriceDaily.objects.bulk_create(rows, batch_size=500)
            self.stdout.write(f"PriceDaily: {len(rows)}")

        # Demo signal: un oxirgi ~3 haftada o'sish → HOZIR OL (DEMO qator)
        un = products.get("un")
        if un:
            dates = list(
                PriceDaily.objects.filter(product=un).values_list("date", flat=True).distinct().order_by("date")
            )[-25:]
            for i, d in enumerate(dates):
                px = 8200 + i * 80
                PriceDaily.objects.filter(product=un, date=d).update(
                    open=px - 40, high=px + 120, low=max(1, px - 120), close=px, median=px
                )

        # a few live crowd observations
        if PriceObservation.objects.filter(source_type="demo").count() < 20:
            un = products["un"]
            m0 = markets["urganch-markaziy"]
            PriceObservation.objects.create(
                product=un,
                market=m0,
                price_per_base_unit=9000,
                qty=50,
                unit="kg",
                raw_text="Dehqon bozorida un, 50 kglik qopi 450 ming",
                source_type="crowd",
                confidence=Decimal("0.93"),
                status="ok",
                user=seller,
                observed_at=timezone.now(),
                parsed={"demo": True},
            )

        # suppliers / offers
        if Supplier.objects.count() < 8:
            names = [
                ("Xorazm Un savdo", "urganch-shahar", "+998907001001", "urganch-ulgurji"),
                ("Xiva Don", "xiva", "+998907001002", "xiva-dehqon"),
                ("Gurlan fermerlar", "gurlan", "+998907001003", "gurlan-bozor"),
                ("Shovot Agro", "shovot", "+998907001004", "shovot-bozor"),
                ("Hazorasp yetkazish", "hazorasp", "+998907001005", "hazorasp-bozor"),
                ("Urganch markaziy savdo", "urganch-shahar", "+998907001006", "urganch-markaziy"),
            ]
            key_slugs = ["un", "guruch", "mol-gosht", "piyoz", "kartoshka", "shakar", "paxta-yog", "tovuq"]
            for name, dslug, phone, mslug in names:
                s = Supplier.objects.create(
                    name=name,
                    district=districts[dslug],
                    phone=phone,
                    rating=Decimal(str(round(random.uniform(4.2, 4.9), 2))),
                    user=seller if "Un" in name else None,
                    is_verified=True,
                    is_demo=True,
                )
                for slug in key_slugs:
                    last = PriceDaily.objects.filter(product=products[slug], market=markets[mslug]).order_by("-date").first()
                    px = last.close if last else bases[slug]
                    Offer.objects.create(
                        supplier=s,
                        product=products[slug],
                        market=markets[mslug],
                        price=int(px * random.uniform(0.95, 1.05)),
                        min_qty=10,
                        delivery_terms="Xorazm bo'ylab 24 soat",
                        is_active=True,
                    )

        # tax + loans
        if TaxRule.objects.count() < 4:
            TaxRule.objects.bulk_create(
                [
                    TaxRule(
                        regime="Aylanma solig'i 4%",
                        rate=Decimal("4.0000"),
                        base="turnover",
                        threshold_min=0,
                        threshold_max=4_940_000_000,
                        sector_filter=["all", "savdo", "ovqatlanish"],
                        valid_from=date(2026, 1, 1),
                        legal_ref_url="https://lex.uz",
                        note="YaTT aylanma solig'i. Manba: Soliq kodeksi / lex.uz",
                    ),
                    TaxRule(
                        regime="Ixtiyoriy 6% (savdo/xizmat)",
                        rate=Decimal("6.0000"),
                        base="turnover",
                        threshold_min=0,
                        threshold_max=None,
                        sector_filter=["savdo", "ovqatlanish", "xizmat"],
                        valid_from=date(2026, 6, 1),
                        legal_ref_url="https://www.gazeta.uz/ru/2026/06/01/small-business/",
                        note="01.06.2026 dan ixtiyoriy 6% rejim",
                    ),
                    TaxRule(
                        regime="QQS 12%",
                        rate=Decimal("12.0000"),
                        base="turnover",
                        threshold_min=4_940_000_000,
                        sector_filter=["all"],
                        valid_from=date(2026, 6, 1),
                        legal_ref_url="https://lex.uz",
                        note="QQS chegarasi ~4,94 mlrd so'm (01.06.2026)",
                    ),
                    TaxRule(
                        regime="O'zini o'zi band (soddalashtirilgan)",
                        rate=Decimal("0.0000"),
                        base="turnover",
                        threshold_min=0,
                        sector_filter=["all"],
                        valid_from=date(2026, 1, 1),
                        legal_ref_url="https://lex.uz",
                        note="Faoliyat turiga qarab belgilangan to'lov. Demo: 0 + ijtimoiy to'lovlar alohida.",
                    ),
                    TaxRule(
                        regime="YaTT foyda solig'i (sodda)",
                        rate=Decimal("15.0000"),
                        base="profit",
                        threshold_min=0,
                        sector_filter=["all"],
                        valid_from=date(2026, 1, 1),
                        legal_ref_url="https://lex.uz",
                    ),
                ]
            )
        if LoanProgram.objects.count() < 5:
            LoanProgram.objects.bulk_create(
                [
                    LoanProgram(
                        name="Ayollar tadbirkorligi imtiyozli krediti",
                        provider="Tijorat banklari / davlat dasturi",
                        rate=Decimal("0.1400"),
                        max_amount=300_000_000,
                        term_months=36,
                        grace_months=6,
                        collateral="Imtiyozli / kafillik",
                        guarantee_pct=Decimal("50"),
                        subsidy_rule={"subsidy": 0.04, "note": "foiz kompensatsiyasi"},
                        eligibility={"gender": "female"},
                        legal_ref_url="https://www.spot.uz/oz/2025/12/04/preferential-loans",
                        valid_from=date(2026, 1, 1),
                    ),
                    LoanProgram(
                        name="Kooperatsiya uchun garovsiz kredit",
                        provider="Davlat dasturi",
                        rate=Decimal("0.1600"),
                        max_amount=200_000_000,
                        term_months=24,
                        grace_months=3,
                        collateral="Garovsiz",
                        guarantee_pct=Decimal("0"),
                        subsidy_rule={"subsidy": 0.02},
                        eligibility={"coop": True},
                        legal_ref_url="https://www.spot.uz/oz/2026/09/12/loans-entrepreneurs",
                        valid_from=date(2026, 9, 11),
                    ),
                    LoanProgram(
                        name="Standart biznes krediti",
                        provider="Tijorat banki",
                        rate=Decimal("0.2180"),
                        max_amount=1_000_000_000,
                        term_months=36,
                        grace_months=0,
                        collateral="Garov talab qilinadi",
                        guarantee_pct=Decimal("0"),
                        subsidy_rule={},
                        eligibility={},
                        legal_ref_url="https://www.gazeta.uz/ru/2026/08/06/credits/",
                        valid_from=date(2026, 1, 1),
                    ),
                    LoanProgram(
                        name="Yoshlar tadbirkorligi",
                        provider="Yoshlar banki / jamg'arma",
                        rate=Decimal("0.1500"),
                        max_amount=150_000_000,
                        term_months=24,
                        grace_months=3,
                        collateral="Kafillik",
                        guarantee_pct=Decimal("30"),
                        subsidy_rule={"subsidy": 0.03},
                        eligibility={"age_max": 30},
                        legal_ref_url="https://lex.uz",
                        valid_from=date(2026, 1, 1),
                    ),
                    LoanProgram(
                        name="Agrokredit (xom ashyo)",
                        provider="Agrobank",
                        rate=Decimal("0.1800"),
                        max_amount=400_000_000,
                        term_months=18,
                        grace_months=4,
                        collateral="Hosildan",
                        guarantee_pct=Decimal("20"),
                        subsidy_rule={"subsidy": 0.02},
                        eligibility={"sector": ["ovqatlanish", "qishloq"]},
                        legal_ref_url="https://lex.uz",
                        valid_from=date(2026, 1, 1),
                    ),
                ]
            )

        biz, _ = Business.objects.get_or_create(
            owner=dilshod,
            name="Dilshod aka somsaxonasi",
            defaults={
                "sector": "ovqatlanish",
                "district": districts["urganch-shahar"],
                "legal_status": Business.LegalStatus.INFORMAL,
                "monthly_revenue": 45_000_000,
                "employees": 4,
                "is_demo": True,
            },
        )
        if biz.entries.count() < 20:
            for i in range(45):
                d = today - timedelta(days=44 - i)
                LedgerEntry.objects.create(
                    business=biz,
                    type="income",
                    amount=random.randint(1_200_000, 2_200_000),
                    category="sotuv",
                    source="manual",
                    confirmed=True,
                    date=d,
                    raw_text="DEMO kunlik tushum",
                )
                LedgerEntry.objects.create(
                    business=biz,
                    type="expense",
                    amount=random.randint(700_000, 1_300_000),
                    category="xarid",
                    source="manual",
                    confirmed=True,
                    date=d,
                    raw_text="DEMO xom ashyo",
                )

        if KnowledgeChunk.objects.count() < 5:
            KnowledgeChunk.objects.bulk_create(
                [
                    KnowledgeChunk(
                        doc_title="Soliq kodeksi",
                        clause="QQS chegarasi",
                        text="2026-yil 1-iyundan QQS hisoblash chegarasi taxminan 4,94 mlrd so'm. Ixtiyoriy 6% rejim savdo va xizmat uchun joriy etilgan.",
                        url="https://lex.uz",
                    ),
                    KnowledgeChunk(
                        doc_title="Markaziy bank",
                        clause="Asosiy stavka",
                        text="MB asosiy stavkasi 14%. So'mdagi biznes kreditlarining o'rtacha foizi 21,8% (iyun 2026).",
                        url="https://www.gazeta.uz/en/2026/07/30/cb-rate/",
                    ),
                    KnowledgeChunk(
                        doc_title="Biznes hamroh",
                        clause="Palata xizmati",
                        text="Savdo-sanoat palatasining Biznes hamroh loyihasi 14 hududiy markaz, Urganchda ham, 1000+ xizmat va 24/7 call-markaz.",
                        url="https://www.spot.uz/oz/2025/12/15/business-companion",
                    ),
                ]
            )

        self.stdout.write(self.style.SUCCESS("seed_demo OK — DEMO ma'lumot"))
