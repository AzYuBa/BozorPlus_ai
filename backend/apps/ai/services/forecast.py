from __future__ import annotations

import math
from datetime import date, timedelta

import numpy as np


def holt_linear(series: list[float], horizon: int = 7, alpha: float = 0.35, beta: float = 0.15):
    if not series:
        return [0.0] * horizon, [0.0] * horizon, [0.0] * horizon
    y = np.array(series, dtype=float)
    level = y[0]
    trend = y[1] - y[0] if len(y) > 1 else 0.0
    fitted = []
    for val in y:
        prev_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - prev_level) + (1 - beta) * trend
        fitted.append(level + trend)
    resid = y - np.array(fitted[: len(y)])
    sigma = float(np.std(resid)) if len(resid) > 2 else float(np.std(y) * 0.1 or 1)
    yhat, lo, hi = [], [], []
    for h in range(1, horizon + 1):
        pred = level + h * trend
        band = 1.28 * sigma * math.sqrt(h)  # ~80% interval
        yhat.append(max(0.0, pred))
        lo.append(max(0.0, pred - band))
        hi.append(max(0.0, pred + band))
    return yhat, lo, hi


def mape(actual: list[float], pred: list[float]) -> float | None:
    pairs = [(a, p) for a, p in zip(actual, pred) if a]
    if not pairs:
        return None
    return float(np.mean([abs(a - p) / a for a, p in pairs]))


def signal_from_forecast(last_price: float, yhat: list[float], lo: list[float], hi: list[float], threshold: float = 0.05):
    if not last_price or not yhat:
        return "NEYTRAL", "Prognoz uchun yetarli ma'lumot yo'q."
    future = yhat[-1]
    delta = (future - last_price) / last_price
    if delta >= threshold and lo[-1] > last_price:
        return "HOZIR OL", f"7 kunda narx ~{delta*100:.1f}% oshishi kutilmoqda. Hozir olish foydali."
    if delta <= -threshold and hi[-1] < last_price:
        return "KUT", f"7 kunda narx ~{abs(delta)*100:.1f}% tushishi kutilmoqda. Kutish foydali."
    return "NEYTRAL", "Narx barqaror zonada, shoshilinch signal yo'q."


def backtest_mape(series: list[float], holdout: int = 14) -> float | None:
    if len(series) < holdout + 14:
        holdout = max(5, len(series) // 4)
    if len(series) < holdout + 5:
        return None
    train, test = series[:-holdout], series[-holdout:]
    yhat, _, _ = holt_linear(train, horizon=len(test))
    return mape(test, yhat)
