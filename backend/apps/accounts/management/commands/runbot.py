from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Telegram bot (long polling). TELEGRAM_BOT_TOKEN talab qiladi."

    def handle(self, *args, **opts):
        token = settings.TELEGRAM_BOT_TOKEN
        if not token:
            self.stderr.write("TELEGRAM_BOT_TOKEN bo'sh — bot ishga tushmadi.")
            return
        import asyncio
        from apps.bot.runner import main

        asyncio.run(main(token))
