# BozorPuls AI

Bozor narxidan biznes-rejagacha: tadbirkorning AI hamrohi.

Hackathon: Umummilliy AI Xakaton · Xorazm · 17–20 sentabr 2026  
Muammolar: **№19 Bozor-Analitika** + **№20 AI moliyaviy maslahatchi**  
Trek: Tadbirkorlik · muammo egasi: O‘zbekiston Savdo-sanoat palatasi

## Nima bu?

Bitta ma’lumot yadrosi, ikki modul:

- **M1 Narx terminali** — crowd narxlar, sham grafik, `HOZIR OL / KUT` signali, AI xarid agenti (TOP-3, yetkazish bilan).
- **M2 Xorazmiy** — ovozli daftar, real narxli biznes-reja, Monte-Karlo stress-test, kredit/soliq kalkulyatorlari, KTI (0–100).

Demo raqamlari `DEMO` belgisi bilan. Har bir moliyaviy javobda manba chipi va ogohlantirish bor.

## Tez start (Windows / local SQLite)

```bash
copy .env.example .env
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Boshqa terminal:

```bash
cd frontend
npm install
npm run dev
```

- Web: http://localhost:5173  
- API / Swagger: http://localhost:8000/api/docs/  
- Admin: http://localhost:8000/admin/  (`admin` / `bozorpuls`)

Demo kirish (web): Dilshod aka, sotuvchi, bozor ma’muri, bank.

## Docker

```bash
copy .env.example .env
docker compose up --build
```

Telegram bot (token `.env` da `TELEGRAM_BOT_TOKEN`):

```bash
docker compose --profile bot up bot
# yoki
python manage.py runbot
```

## Demo oqimi (2 daqiqa)

1. Pulse: «Dehqon bozorida un, 50 kglik qopi 450 ming» → 9 000 so‘m/kg, tasdiq, tiker.
2. Terminal `/product/un` — sham grafik, prognoz zonasi, signal.
3. Agent: «Somsaxonaga 500 kg un kerak» → TOP-3 yakuniy narx.
4. Biznes-reja → stress-test → Kredit markazi (KTI + 3 qadam) → soliq taqqoslovi → paketni bankka yuborish.

## API (asosiy)

| Metod | Yo‘l |
| --- | --- |
| POST | `/api/auth/demo/` |
| POST | `/api/prices/ingest/` |
| GET | `/api/prices/pulse/` `/api/prices/ohlc/` `/api/forecast/` |
| POST | `/api/sourcing/search/` `/api/agent/chat/` |
| POST | `/api/finance/loan/calc/` `/api/finance/tax/compare/` |
| POST | `/api/plans/` `/api/plans/{id}/stress-test/` |

## Testlar

```bash
cd backend
pytest -q
```

## Stek

Django 5 / DRF · React 18 + Vite + TypeScript · PostgreSQL/SQLite · Celery/Redis · aiogram 3

TZ: `docs/BozorPuls_AI_TZ_v2.docx`
