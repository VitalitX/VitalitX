"""
VitalityX — Consequence Alert Engine
Maps stock decline to real-world cost projections.
Alerts shown in user's local currency alongside VTL price.
"""

from dataclasses import dataclass
from typing import List, Optional
from core.schema import StockTicker
from core.pricing import calculate_price, streak_multiplier
from datetime import datetime


@dataclass
class ConsequenceAlert:
    ticker: StockTicker
    severity: str           # "warning" | "danger"
    headline: str           # short headline shown on dashboard
    detail: str             # full consequence explanation
    cost_impact: str        # real-world cost projection (localised)
    action_prompt: str      # what to do to reverse it
    decline_pct: float      # how far below peak


# ── Alert templates per stock ─────────────────────────────────────────────────

def _health_alerts(decline_pct: float, local_currency: str = "₹") -> List[ConsequenceAlert]:
    alerts = []

    if decline_pct >= 20:
        alerts.append(ConsequenceAlert(
            ticker=StockTicker.HEALTH,
            severity="danger",
            headline="HLT in bear market — physical costs rising",
            detail="Sustained inactivity correlates with higher preventive care needs, increased cholesterol risk, and reduced metabolic rate.",
            cost_impact=f"Estimated annual health cost increase: {local_currency}8,000–{local_currency}15,000",
            action_prompt="Log a gym session or 30-min walk to start recovery",
            decline_pct=decline_pct,
        ))
    elif decline_pct >= 12:
        alerts.append(ConsequenceAlert(
            ticker=StockTicker.HEALTH,
            severity="warning",
            headline="HLT trending down — check-up costs ahead",
            detail="5+ days without physical activity begins affecting cardiovascular baselines. Annual check-up costs increase.",
            cost_impact=f"Projected preventive check-up cost: {local_currency}2,400–{local_currency}4,000/year",
            action_prompt="Any movement counts — even a 20-min walk recovers 8 VTL",
            decline_pct=decline_pct,
        ))

    return alerts


def _wealth_alerts(decline_pct: float, local_currency: str = "₹") -> List[ConsequenceAlert]:
    alerts = []

    if decline_pct >= 15:
        alerts.append(ConsequenceAlert(
            ticker=StockTicker.WEALTH,
            severity="danger",
            headline="WLT critical — compounding loss accelerating",
            detail="Missed SIP contributions and inactive savings create compounding opportunity cost that grows exponentially over time.",
            cost_impact=f"Compounding loss at 12% CAGR: {local_currency}50,000+ over 5 years per missed month",
            action_prompt="Activate SIP or add to savings — even small amounts restart compounding",
            decline_pct=decline_pct,
        ))
    elif decline_pct >= 8:
        alerts.append(ConsequenceAlert(
            ticker=StockTicker.WEALTH,
            severity="warning",
            headline="WLT dipping — wealth momentum slowing",
            detail="No recent savings activity detected. Wealth stock decays slowly but consistently without active inputs.",
            cost_impact=f"Opportunity cost: {local_currency}12,000–{local_currency}20,000/year in foregone returns",
            action_prompt="Review Zerodha portfolio or log a savings action to stabilise",
            decline_pct=decline_pct,
        ))

    return alerts


def _social_alerts(decline_pct: float, local_currency: str = "₹") -> List[ConsequenceAlert]:
    alerts = []

    if decline_pct >= 30:
        alerts.append(ConsequenceAlert(
            ticker=StockTicker.SOCIAL,
            severity="danger",
            headline="SOC in freefall — isolation compounding",
            detail="Research links prolonged social isolation to 26% higher stress cortisol, reduced professional network value, and missed opportunities.",
            cost_impact="Network value erosion: estimated 15–20% reduction in referral-based opportunities",
            action_prompt="Attend one event or call someone you haven't spoken to in weeks",
            decline_pct=decline_pct,
        ))
    elif decline_pct >= 15:
        alerts.append(ConsequenceAlert(
            ticker=StockTicker.SOCIAL,
            severity="warning",
            headline="SOC declining — social momentum fading",
            detail="No social activity logged in 4+ days. Relationships require consistent maintenance — neglect compounds.",
            cost_impact="Professional network decay: warm connections becoming cold",
            action_prompt="A 15-min call with a friend or colleague recovers 7 VTL immediately",
            decline_pct=decline_pct,
        ))

    return alerts


# ── Main alert generator ──────────────────────────────────────────────────────

def generate_alerts(
    ticker: StockTicker,
    streak_days: int,
    last_activity_at: Optional[datetime],
    local_currency: str = "₹",
) -> List[ConsequenceAlert]:
    """
    Generate consequence alerts for a stock based on how far it has declined
    from its peak (streak_multiplier × base_price).
    """
    from core.schema import STOCK_MAP
    stock = STOCK_MAP[ticker]

    current_price = calculate_price(ticker, streak_days, last_activity_at)
    peak_price = stock.base_price * streak_multiplier(streak_days, stock.streak_cap)
    decline_pct = round(((peak_price - current_price) / peak_price) * 100, 1)

    if ticker == StockTicker.HEALTH:
        return _health_alerts(decline_pct, local_currency)
    elif ticker == StockTicker.WEALTH:
        return _wealth_alerts(decline_pct, local_currency)
    elif ticker == StockTicker.SOCIAL:
        return _social_alerts(decline_pct, local_currency)

    return []


def generate_all_alerts(portfolio: List[dict], local_currency: str = "₹") -> List[ConsequenceAlert]:
    """
    Pass in list of {ticker, streak_days, last_activity_at} dicts.
    Returns all active alerts across the portfolio, sorted by severity.
    """
    all_alerts = []
    for stock_state in portfolio:
        alerts = generate_alerts(
            ticker=stock_state["ticker"],
            streak_days=stock_state.get("streak_days", 0),
            last_activity_at=stock_state.get("last_activity_at"),
            local_currency=local_currency,
        )
        all_alerts.extend(alerts)

    # danger first, then warning
    return sorted(all_alerts, key=lambda a: 0 if a.severity == "danger" else 1)
