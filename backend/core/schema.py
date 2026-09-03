"""
VitalityX — Core Stock Schema
Currency: Vitals (VTL)
"""

from dataclasses import dataclass
from enum import Enum
from typing import List


class StockTicker(str, Enum):
    HEALTH = "HLT"
    WEALTH = "WLT"
    SOCIAL = "SOC"


@dataclass
class ActivityType:
    name: str
    ticker: StockTicker
    vtl_impact: float      # base VTL added to streak when logged
    description: str


@dataclass
class StockDefinition:
    ticker: StockTicker
    name: str
    base_price: float      # starting VTL price
    decay_rate: float      # exponential decay per day (higher = faster decay)
    streak_cap: int        # max streak days that multiply price
    alert_threshold: float # % below peak that triggers consequence alert
    activities: List[ActivityType]


# ── Activity catalogue ────────────────────────────────────────────────────────

ACTIVITIES: List[ActivityType] = [
    # Health
    ActivityType("gym_session",     StockTicker.HEALTH, 12.0, "Gym or strength training"),
    ActivityType("run_walk",        StockTicker.HEALTH,  8.0, "Run or walk (30+ min)"),
    ActivityType("sleep_logged",    StockTicker.HEALTH,  6.0, "7-9 hours sleep"),
    ActivityType("healthy_meal",    StockTicker.HEALTH,  4.0, "Logged a healthy meal"),

    # Wealth
    ActivityType("sip_active",      StockTicker.WEALTH, 10.0, "SIP deducted this month"),
    ActivityType("savings_added",   StockTicker.WEALTH, 12.0, "Added to savings"),
    ActivityType("portfolio_check", StockTicker.WEALTH,  3.0, "Reviewed portfolio"),
    ActivityType("zerodha_sync",    StockTicker.WEALTH,  0.0, "Auto-sync from Zerodha"),  # impact via market price

    # Social
    ActivityType("event_attended",  StockTicker.SOCIAL, 10.0, "Attended a social event"),
    ActivityType("friend_call",     StockTicker.SOCIAL,  7.0, "Called or met a friend"),
    ActivityType("networking_meet", StockTicker.SOCIAL,  9.0, "Professional networking"),
]

ACTIVITY_MAP = {a.name: a for a in ACTIVITIES}


# ── Stock definitions ─────────────────────────────────────────────────────────

STOCKS: List[StockDefinition] = [
    StockDefinition(
        ticker=StockTicker.HEALTH,
        name="Health",
        base_price=1000.0,
        decay_rate=0.35,       # fast: 2 days inactivity → noticeable drop
        streak_cap=30,
        alert_threshold=0.80,  # alert when < 80% of peak
        activities=[a for a in ACTIVITIES if a.ticker == StockTicker.HEALTH],
    ),
    StockDefinition(
        ticker=StockTicker.WEALTH,
        name="Wealth",
        base_price=1000.0,
        decay_rate=0.05,       # slow: weeks to decay meaningfully
        streak_cap=60,
        alert_threshold=0.85,
        activities=[a for a in ACTIVITIES if a.ticker == StockTicker.WEALTH],
    ),
    StockDefinition(
        ticker=StockTicker.SOCIAL,
        name="Social",
        base_price=1000.0,
        decay_rate=0.18,       # medium: ~4 days inactivity → visible drop
        streak_cap=30,
        alert_threshold=0.70,
        activities=[a for a in ACTIVITIES if a.ticker == StockTicker.SOCIAL],
    ),
]

STOCK_MAP = {s.ticker: s for s in STOCKS}
