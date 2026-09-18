from __future__ import annotations

import math
from typing import Iterable

import numpy as np


def mad_z_score(value: float, series: Iterable[float]) -> float:
    arr = np.array(list(series), dtype=float)
    if arr.size == 0:
        return 0.0
    med = float(np.median(arr))
    mad = float(np.median(np.abs(arr - med)))
    if mad == 0:
        return 0.0 if value == med else 10.0
    return 0.6745 * (value - med) / mad


def is_anomalous(value: float, series: Iterable[float], threshold: float = 3.5) -> tuple[bool, float]:
    z = mad_z_score(value, series)
    return abs(z) > threshold, z
