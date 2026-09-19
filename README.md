# Bozor-Puls.Ai

Qora / grafit / to‘q yashil birja terminali — React + Django MVP.

## Nima ishlaydi

- React/TSX frontend (Vite) — xuddi shu terminal dizayn
- Haqiqiy ro‘yxat / kirish (email + parol, JWT)
- Rollar: `business`, `forwarder`
- Profil va kirim-chiqim (daftar) SQLite’da, foydalanuvchi izolyatsiyasi
- Jonli OHLC grafik: Yahoo Finance futures + open.er-api.com USD/UZS → mahalliy UZS proxy
- Biznes kalkulyator (mahalliy)

## AI

`backend/.env` ichida:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Keyin Django’ni qayta ishga tushiring. Frontendga kalit yozilmaydi.

## Hali ulanmagan

- Ovoz / Telegram bot
- To‘lov / karmon amallari
- SMS OTP

## Ishga tushirish

### Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
# backend\.env: DJANGO_SECRET_KEY=dev-secret
python manage.py migrate
python manage.py runserver 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Brauzer: http://localhost:5173  
API proxy: Vite `/api` → `http://127.0.0.1:8000`

## API (qisqa)

| Method | Path | Izoh |
|--------|------|------|
| POST | `/api/v1/auth/register/` | email, password, role, consent |
| POST | `/api/v1/auth/login/` | email, password |
| GET/PATCH | `/api/v1/me/` | profil |
| GET/POST | `/api/v1/notebook/entries/` | daftar |
| GET | `/api/v1/market/instruments/` | mahsulotlar + narx |
| GET | `/api/v1/market/candles/?product=un&days=90` | OHLC shamlar |
| GET | `/api/v1/market/fx/` | USD/UZS |
| GET | `/api/v1/ai/status/` | AI sozlanganmi |
| POST | `/api/v1/ai/chat/` | `{ message, history? }` |

Sirlar faqat `backend/.env` da. Frontendga API kalitlari yozilmaydi.
