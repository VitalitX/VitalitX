"""
VitalityX — Groww Sync Route
GET /sync/groww/{user_id} → fetch live portfolio, reprice WLT

Performance fix: returns cached result immediately if last sync < 5 min ago.
Groww API call runs with a 8s timeout to prevent hanging.
"""

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.models import get_db, StockState, ActivityLog, SparklinePoint
from core.schema import StockTicker
from core.groww import fetch_portfolio_summary, compute_wlt_boost
from core.pricing import calculate_price, streak_multiplier

sync_router = APIRouter(prefix="/sync", tags=["integrations"])

# In-memory cache: user_id → {result, cached_at}
_sync_cache: dict = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_cached(user_id: str):
    entry = _sync_cache.get(user_id)
    if not entry:
        return None
    age = (datetime.now(timezone.utc) - entry["cached_at"]).total_seconds()
    if age > CACHE_TTL_SECONDS:
        return None
    return entry["result"]


def set_cached(user_id: str, result: dict):
    _sync_cache[user_id] = {
        "result": result,
        "cached_at": datetime.now(timezone.utc),
    }


@sync_router.get("/groww/{user_id}")
def sync_groww(user_id: str, force: bool = False, db: Session = Depends(get_db)):
    """
    Sync Groww portfolio into WLT stock price.
    Returns cached result if last sync < 5 min ago (unless force=true).
    """

    # Return cache immediately if fresh
    if not force:
        cached = get_cached(user_id)
        if cached:
            cached["from_cache"] = True
            return cached

    # Fetch from Groww with timeout guard
    try:
        portfolio = fetch_portfolio_summary()
    except Exception as e:
        return {
            "status": "error",
            "message": f"Groww unreachable: {str(e)}",
            "wlt_unchanged": True,
            "from_cache": False,
        }

    if not portfolio.get("success"):
        return {
            "status": "error",
            "message": f"Groww fetch failed: {portfolio.get('error', 'unknown')}",
            "wlt_unchanged": True,
            "from_cache": False,
        }

    boost = compute_wlt_boost(portfolio)

    # Get or create WLT state
    state = db.query(StockState).filter_by(
        user_id=user_id, ticker=StockTicker.WEALTH.value
    ).first()

    if not state:
        state = StockState(
            id=str(uuid.uuid4()),
            user_id=user_id,
            ticker=StockTicker.WEALTH.value,
            current_price=1000.0,
            previous_price=1000.0,
            peak_price=1000.0,
            streak_days=0,
        )
        db.add(state)

    base_price = calculate_price(StockTicker.WEALTH, state.streak_days, state.last_activity_at)
    new_price  = round(base_price * boost["boost_multiplier"], 2)

    state.previous_price  = state.current_price
    state.current_price   = new_price
    state.peak_price      = round(max(state.peak_price or 0, new_price), 2)
    state.last_activity_at = datetime.now(timezone.utc)
    state.last_updated    = datetime.now(timezone.utc)

    db.add(SparklinePoint(
        id=str(uuid.uuid4()),
        user_id=user_id,
        ticker=StockTicker.WEALTH.value,
        price=new_price,
    ))
    db.add(ActivityLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        ticker=StockTicker.WEALTH.value,
        activity_type="zerodha_sync",
        vtl_gained=round(new_price - state.previous_price, 2),
        note=f"Groww sync: {boost['reason']}",
    ))
    db.commit()

    result = {
        "status": "synced",
        "portfolio": {
            "total_invested":  portfolio["total_invested"],
            "current_value":   portfolio["current_value"],
            "total_pnl":       portfolio["total_pnl"],
            "pnl_pct":         portfolio["pnl_pct"],
            "holdings_count":  portfolio["holdings_count"],
        },
        "wlt": {
            "previous_price": state.previous_price,
            "new_price":      new_price,
            "change":         round(new_price - state.previous_price, 2),
            "signal":         boost["signal"],
            "reason":         boost["reason"],
        },
        "synced_at":   datetime.now(timezone.utc).isoformat(),
        "from_cache":  False,
    }

    set_cached(user_id, result)
    return result