"""
VitalityX — Pricing Engine
Formula: price = base × streak_multiplier × recency_score
Currency: Vitals (VTL)
"""

import math
from datetime import datetime, timezone
from typing import Optional
from core.schema import StockDefinition, STOCK_MAP, StockTicker


def recency_score(decay_rate: float, days_since_last: float) -> float:
    """
    Exponential decay: score = e^(-decay_rate * days)
    - days=0  → score=1.0  (just logged, full price)
    - days=2  → HLT=0.50, SOC=0.70, WLT=0.90
    - days=7  → HLT=0.09, SOC=0.28, WLT=0.70
    """
    return math.exp(-decay_rate * days_since_last)


def streak_multiplier(streak_days: int, streak_cap: int) -> float:
    """
    +2% per streak day, capped at streak_cap.
    streak=0  → 1.00x
    streak=10 → 1.20x
    streak=30 → 1.60x (cap for HLT/SOC)
    """
    capped = min(streak_days, streak_cap)
    return 1.0 + (capped * 0.02)


def calculate_price(
    ticker: StockTicker,
    streak_days: int,
    last_activity_at: Optional[datetime],
) -> float:
    """
    Core pricing function. Returns current VTL price for a stock.
    """
    stock: StockDefinition = STOCK_MAP[ticker]

    if last_activity_at is None:
        # Never logged — decay from inception (treat as 30 days ago)
        days_since = 30.0
    else:
        now = datetime.now(timezone.utc)
        last = last_activity_at.replace(tzinfo=timezone.utc) if last_activity_at.tzinfo is None else last_activity_at
        days_since = max(0.0, (now - last).total_seconds() / 86400)

    r = recency_score(stock.decay_rate, days_since)
    s = streak_multiplier(streak_days, stock.streak_cap)
    price = stock.base_price * s * r

    return round(price, 2)


def calculate_change(current_price: float, previous_price: float) -> dict:
    """Returns price change and percentage for the dashboard ticker."""
    if previous_price == 0:
        return {"change": 0.0, "change_pct": 0.0, "direction": "flat"}

    change = round(current_price - previous_price, 2)
    change_pct = round((change / previous_price) * 100, 2)
    direction = "up" if change > 0 else "down" if change < 0 else "flat"

    return {"change": change, "change_pct": change_pct, "direction": direction}


def days_until_alert(
    ticker: StockTicker,
    streak_days: int,
    last_activity_at: Optional[datetime],
) -> Optional[float]:
    """
    How many more days of inactivity until this stock triggers an alert?
    Returns None if already in alert territory.
    """
    stock = STOCK_MAP[ticker]
    current = calculate_price(ticker, streak_days, last_activity_at)
    peak = stock.base_price * streak_multiplier(streak_days, stock.streak_cap)
    threshold_price = peak * stock.alert_threshold

    if current <= threshold_price:
        return None  # already alerting

    # Solve: peak * s * e^(-d * t) = threshold_price
    # t = -ln(threshold / (peak * s)) / d
    s = streak_multiplier(streak_days, stock.streak_cap)
    try:
        t = -math.log(threshold_price / (stock.base_price * s)) / stock.decay_rate
        now_days = 0.0
        if last_activity_at:
            now = datetime.now(timezone.utc)
            last = last_activity_at.replace(tzinfo=timezone.utc) if last_activity_at.tzinfo is None else last_activity_at
            now_days = (now - last).total_seconds() / 86400
        remaining = t - now_days
        return round(max(0.0, remaining), 1)
    except (ValueError, ZeroDivisionError):
        return None
