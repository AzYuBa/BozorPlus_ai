from __future__ import annotations

from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.prices.models import PriceObservation
from apps.prices.views import ingest as ingest_view
from rest_framework.test import APIRequestFactory


User = get_user_model()


async def main(token: str):
    from aiogram import Bot, Dispatcher, F
    from aiogram.filters import CommandStart, Command
    from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton

    bot = Bot(token)
    dp = Dispatcher()

    @dp.message(CommandStart())
    async def start(m: Message):
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="Tadbirkor", callback_data="role:entrepreneur"),
                    InlineKeyboardButton(text="Sotuvchi", callback_data="role:supplier"),
                ]
            ]
        )
        await m.answer(
            "BozorPuls AI — narxdan biznes-rejagacha.\n"
            "Rolni tanlang. Davom etish orqali oferta va ma'lumotlarga rozilik bildirasiz.",
            reply_markup=kb,
        )

    @dp.callback_query(F.data.startswith("role:"))
    async def set_role(c: CallbackQuery):
        role = c.data.split(":")[1]
        await sync_to_async(_ensure_user)(c.from_user.id, c.from_user.full_name, role)
        await c.message.answer(
            "Rahmat. Narx yuboring: matn, ovoz yoki rasm.\n"
            "Masalan: «un, 50 kglik qopi 450 ming»\n"
            "/arzon — xarid agenti\n/hisobot — ovozli daftar"
        )
        await c.answer()

    @dp.message(Command("hisobot"))
    async def hisobot(m: Message):
        from apps.ledger.views import report
        factory = APIRequestFactory()
        data = await sync_to_async(lambda: report(factory.get("/", {"period": "month"})).data)()
        await m.answer(
            f"Oy: kirim {data.get('income'):,} · chiqim {data.get('expense'):,} · sof {data.get('net'):,} so'm"
        )

    @dp.message(Command("arzon"))
    async def arzon(m: Message):
        await m.answer("Nima kerak? Masalan: Urganchga 2 tonna un")

    @dp.message(F.text)
    async def text_price(m: Message):
        factory = APIRequestFactory()
        resp = await sync_to_async(lambda: ingest_view(factory.post("/", {"text": m.text}, format="json")))()
        data = resp.data
        if resp.status_code >= 400:
            await m.answer(data.get("detail") or "Tushunmadim, qayta yozing.")
            return
        oid = data.get("id")
        kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="To'g'ri ✅", callback_data=f"ok:{oid}"),
                    InlineKeyboardButton(text="Noto'g'ri", callback_data=f"no:{oid}"),
                ]
            ]
        )
        extra = "  [tekshiruvda]" if data.get("status") == "review" else ""
        await m.answer(data.get("message") + extra, reply_markup=kb)

    @dp.callback_query(F.data.startswith("ok:") | F.data.startswith("no:"))
    async def confirm(c: CallbackQuery):
        action, oid = c.data.split(":")
        ok = action == "ok"
        await sync_to_async(PriceObservation.objects.filter(pk=int(oid)).update)(status="ok" if ok else "rejected")
        await c.message.answer("Tasdiqlandi. +10 ball" if ok else "Rad etildi.")
        await c.answer()

    @dp.message(F.voice)
    async def voice(m: Message):
        await m.answer(
            "Ovoz qabul qilindi. STT uchun model sozlanmagan bo'lsa, matn yuboring.\n"
            "Namuna: «Dehqon bozorida un, 50 kglik qopi 450 ming»"
        )

    await dp.start_polling(bot)


def _ensure_user(tid, name, role):
    User.objects.get_or_create(
        telegram_id=tid,
        defaults={"username": f"tg_{tid}", "first_name": name[:30], "role": role, "consent_at": timezone.now()},
    )
