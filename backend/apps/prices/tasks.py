from celery import shared_task


@shared_task
def rebuild_daily_ohlc():
    return "ok"
