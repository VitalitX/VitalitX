"""
VitalityX — Groww Integration
Pulls real portfolio data and feeds the WLT (Wealth) stock.
Token is read from .env — never hardcoded.
"""

import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()


def get_groww_client():
    from growwapi import GrowwAPI
    token = os.getenv("GROWW_API_TOKEN")
    if not token:
        raise ValueError("GROWW_API_TOKEN not found in .env file")
    return GrowwAPI(token)


def fetch_portfolio_summary() -> dict:
    try:
        groww = get_groww_client()
        response = groww.get_holdings_for_user(timeout=10)
        holdings = response.get("holdings", [])

        total_invested = 0.0
        current_value = 0.0
        ltp_available = False

        for h in holdings:
            qty = float(h.get("quantity", 0) or 0)
            avg_price = float(h.get("average_price", 0) or 0)

            # Try every possible LTP field Groww might return
            ltp = (
                h.get("ltp") or
                h.get("last_price") or
                h.get("current_price") or
                avg_price
            )
            ltp = float(ltp or avg_price)

            if ltp != avg_price:
                ltp_available = True

            total_invested += qty * avg_price
            current_value += qty * ltp

        total_pnl = current_value - total_invested
        pnl_pct = round((total_pnl / total_invested * 100), 2) if total_invested > 0 else 0.0

        return {
            "success": True,
            "total_invested": round(total_invested, 2),
            "current_value": round(current_value, 2),
            "total_pnl": round(total_pnl, 2),
            "pnl_pct": pnl_pct,
            "holdings_count": len(holdings),
            "ltp_available": ltp_available,
            "sip_detected": False,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "total_invested": 0.0,
            "current_value": 0.0,
            "total_pnl": 0.0,
            "pnl_pct": 0.0,
            "holdings_count": 0,
            "ltp_available": False,
            "sip_detected": False,
        }


def compute_wlt_boost(portfolio: dict) -> dict:
    if not portfolio.get("success") or portfolio["holdings_count"] == 0:
        return {
            "boost_multiplier": 1.0,
            "signal": "neutral",
            "reason": "No holdings found — WLT at base. Log savings activity manually.",
        }

    pnl_pct = portfolio["pnl_pct"]
    ltp_available = portfolio.get("ltp_available", False)
    holdings_count = portfolio["holdings_count"]

    # Free plan fallback — reward portfolio existence and diversity
    if not ltp_available or pnl_pct == 0.0:
        base_boost = min(1.0 + (holdings_count * 0.01), 1.20)
        return {
            "boost_multiplier": round(base_boost, 3),
            "signal": "bullish" if holdings_count >= 5 else "neutral",
            "reason": f"{holdings_count} active holdings detected — upgrade Groww plan for live P&L pricing",
        }

    # Live P&L available
    if pnl_pct >= 10:
        multiplier, signal = 1.20, "bullish"
        reason = f"Portfolio up {pnl_pct}% — strong wealth momentum"
    elif pnl_pct >= 3:
        multiplier, signal = 1.10, "bullish"
        reason = f"Portfolio up {pnl_pct}% — healthy gains"
    elif pnl_pct >= 0:
        multiplier, signal = 1.02, "neutral"
        reason = f"Portfolio flat (+{pnl_pct}%) — holding steady"
    elif pnl_pct >= -5:
        multiplier, signal = 0.92, "bearish"
        reason = f"Portfolio down {abs(pnl_pct)}% — minor drawdown"
    else:
        multiplier = max(0.75, 1.0 + (pnl_pct / 100))
        signal = "bearish"
        reason = f"Portfolio down {abs(pnl_pct)}% — significant drawdown affecting WLT"

    return {
        "boost_multiplier": round(multiplier, 3),
        "signal": signal,
        "reason": reason,
    }