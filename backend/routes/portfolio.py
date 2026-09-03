"""
VitalityX — API Routes
POST /log             → log an activity, reprice the stock
GET  /portfolio/{id}  → read portfolio (no writes unless reprice is stale)
GET  /portfolio/{id}/history → VTL history for chart
GET  /activities      → list valid activity types

Critical fixes applied:
- reprice() only runs on GET if > 1 hour since last reprice (no writes on every read)
- streak increments max once per calendar day (dedup via last_activity_date)
- DB indexes on all hot paths (in models.py)
- uuid imported once at top, not inside functions
- user_id basic validation
"""

import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.models import get_db, StockState, ActivityLog, SparklinePoint, PortfolioSnapshot
from core.schema import ACTIVITY_MAP, STOCK_MAP, StockTicker
from core.pricing import calculate_price, calculate_change
from core.alerts import generate_all_alerts

router = APIRouter()

VALID_USER_ID = re.compile(r'^[a-zA-Z0-9_\-]{1,64}$')


# ── Request models ────────────────────────────────────────────────────────────

class LogActivityRequest(BaseModel):
    user_id: str
    activity_type: str
    note: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def validate_user_id(user_id: str):
    if not VALID_USER_ID.match(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format")


def get_or_create_stock(db: Session, user_id: str, ticker: StockTicker) -> StockState:
    state = db.query(StockState).filter_by(user_id=user_id, ticker=ticker.value).first()
    if not state:
        state = StockState(
            id=str(uuid.uuid4()),
            user_id=user_id,
            ticker=ticker.value,
            current_price=1000.0,
            previous_price=1000.0,
            peak_price=1000.0,
            streak_days=0,
        )
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def reprice(db: Session, state: StockState) -> StockState:
    """Recalculate price and persist. Saves sparkline point."""
    ticker = StockTicker(state.ticker)
    new_price = calculate_price(ticker, state.streak_days, state.last_activity_at)

    state.previous_price = state.current_price
    state.current_price  = round(new_price, 2)
    state.peak_price     = round(max(state.peak_price or 0, new_price), 2)
    state.last_updated   = datetime.now(timezone.utc)
    state.last_reprice_at = datetime.now(timezone.utc)

    db.add(SparklinePoint(
        id=str(uuid.uuid4()),
        user_id=state.user_id,
        ticker=state.ticker,
        price=state.current_price,
    ))
    db.commit()
    db.refresh(state)
    return state


def maybe_reprice(db: Session, state: StockState) -> StockState:
    """
    Reprice only if it's been more than 1 hour since last reprice.
    Prevents write-on-every-read from the 60s auto-refresh.
    """
    if state.last_reprice_at is None:
        return reprice(db, state)

    last = state.last_reprice_at
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)

    if (datetime.now(timezone.utc) - last).total_seconds() > 3600:
        return reprice(db, state)

    return state


def get_sparkline(db: Session, user_id: str, ticker: str, points: int = 7) -> list:
    rows = (
        db.query(SparklinePoint)
        .filter_by(user_id=user_id, ticker=ticker)
        .order_by(SparklinePoint.recorded_at.desc())
        .limit(points)
        .all()
    )
    return [round(r.price, 2) for r in reversed(rows)]


def build_status(streak: int, current: float, peak: float) -> str:
    """Streak + price vs peak — not last tick direction."""
    ratio = current / peak if peak else 1.0
    if streak >= 5 and ratio >= 0.75:
        return "bullish"
    elif streak >= 2 and ratio >= 0.50:
        return "steady"
    return "bearish"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/log")
def log_activity(req: LogActivityRequest, db: Session = Depends(get_db)):
    """
    Log an activity. Reprices the relevant stock immediately.
    Streak increments max once per calendar day.
    Rate limit: max 10 logs per user per stock per day.
    """
    validate_user_id(req.user_id)

    activity = ACTIVITY_MAP.get(req.activity_type)
    if not activity:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown activity '{req.activity_type}'. Valid: {list(ACTIVITY_MAP.keys())}"
        )

    ticker = activity.ticker
    state  = get_or_create_stock(db, req.user_id, ticker)
    now    = datetime.now(timezone.utc)
    today  = now.strftime("%Y-%m-%d")

    # ── Rate limit: max 10 logs per stock per day ──────────────────────────
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    logs_today  = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.user_id == req.user_id,
            ActivityLog.ticker  == ticker.value,
            ActivityLog.logged_at >= today_start,
        )
        .count()
    )
    if logs_today >= 10:
        raise HTTPException(
            status_code=429,
            detail=f"Max 10 {ticker.value} activities per day. Come back tomorrow."
        )

    # ── Streak: increment max once per calendar day ────────────────────────
    last_date = state.last_activity_date  # stored as "YYYY-MM-DD"

    if last_date is None:
        # First ever activity
        state.streak_days = 1

    elif last_date == today:
        # Already logged today — streak stays the same, no increment
        pass

    else:
        # Check if yesterday was logged (streak continues) or gap (streak breaks)
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        if last_date == yesterday:
            state.streak_days += 1
        else:
            state.streak_days = 1  # streak broken

    state.last_activity_date = today
    state.last_activity_at   = now

    # ── Reprice immediately on log (always) ───────────────────────────────
    state = reprice(db, state)

    # ── Save activity log ─────────────────────────────────────────────────
    db.add(ActivityLog(
        id=str(uuid.uuid4()),
        user_id=req.user_id,
        ticker=ticker.value,
        activity_type=req.activity_type,
        vtl_gained=activity.vtl_impact,
        note=req.note,
    ))
    db.commit()

    return {
        "status": "logged",
        "activity": req.activity_type,
        "ticker": ticker.value,
        "vtl_gained": activity.vtl_impact,
        "new_price": state.current_price,
        "streak_days": state.streak_days,
    }


@router.get("/portfolio/{user_id}")
def get_portfolio(user_id: str, currency: str = "₹", db: Session = Depends(get_db)):
    """
    Read portfolio. Reprice only if stale (>1 hour).
    No writes on every page load.
    """
    validate_user_id(user_id)

    stocks_out     = []
    portfolio_input = []

    for ticker in StockTicker:
        state = get_or_create_stock(db, user_id, ticker)

        # Only reprice if stale — prevents write-on-every-read
        state = maybe_reprice(db, state)

        change_data = calculate_change(state.current_price, state.previous_price)
        sparkline   = get_sparkline(db, user_id, ticker.value)
        stock_def   = STOCK_MAP[ticker]
        status      = build_status(state.streak_days, state.current_price, state.peak_price or state.current_price)

        stocks_out.append({
            "ticker":           ticker.value,
            "name":             stock_def.name,
            "price":            state.current_price,
            "previous_price":   state.previous_price,
            "peak_price":       state.peak_price,
            "change":           change_data["change"],
            "change_pct":       change_data["change_pct"],
            "direction":        change_data["direction"],
            "streak_days":      state.streak_days,
            "last_activity_at": state.last_activity_at,
            "sparkline":        sparkline,
            "status":           status,
        })

        portfolio_input.append({
            "ticker":           ticker,
            "streak_days":      state.streak_days,
            "last_activity_at": state.last_activity_at,
        })

    alerts_raw = generate_all_alerts(portfolio_input, local_currency=currency)
    alerts_out = [
        {
            "ticker":       a.ticker.value,
            "severity":     a.severity,
            "headline":     a.headline,
            "detail":       a.detail,
            "cost_impact":  a.cost_impact,
            "action_prompt": a.action_prompt,
            "decline_pct":  a.decline_pct,
        }
        for a in alerts_raw
    ]

    total_vtl       = round(sum(s["price"] for s in stocks_out), 2)
    price_by_ticker = {s["ticker"]: s["price"] for s in stocks_out}

    # Save portfolio snapshot — throttled to once per 60s
    last_snap = (
        db.query(PortfolioSnapshot)
        .filter_by(user_id=user_id)
        .order_by(PortfolioSnapshot.recorded_at.desc())
        .first()
    )
    now = datetime.now(timezone.utc)
    last_snap_time = (
        last_snap.recorded_at.replace(tzinfo=timezone.utc)
        if last_snap and last_snap.recorded_at.tzinfo is None
        else (last_snap.recorded_at if last_snap else None)
    )
    if last_snap_time is None or (now - last_snap_time).total_seconds() > 60:
        db.add(PortfolioSnapshot(
            id=str(uuid.uuid4()),
            user_id=user_id,
            total_vtl=total_vtl,
            hlt_price=price_by_ticker.get("HLT", 0),
            wlt_price=price_by_ticker.get("WLT", 0),
            soc_price=price_by_ticker.get("SOC", 0),
        ))
        db.commit()

    return {
        "user_id":      user_id,
        "total_vtl":    total_vtl,
        "stocks":       stocks_out,
        "alerts":       alerts_out,
        "generated_at": now,
    }


@router.get("/activities")
def list_activities():
    return {
        ticker.value: [
            {"type": a.name, "vtl_impact": a.vtl_impact, "description": a.description}
            for a in STOCK_MAP[ticker].activities
        ]
        for ticker in StockTicker
    }


@router.get("/portfolio/{user_id}/history")
def get_portfolio_history(user_id: str, days: int = 30, db: Session = Depends(get_db)):
    validate_user_id(user_id)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    snaps = (
        db.query(PortfolioSnapshot)
        .filter(
            PortfolioSnapshot.user_id == user_id,
            PortfolioSnapshot.recorded_at >= cutoff,
        )
        .order_by(PortfolioSnapshot.recorded_at.asc())
        .all()
    )

    if not snaps:
        return {"points": [], "summary": {"min": 0, "max": 0, "change_pct": 0}}

    points = [
        {
            "ts":    s.recorded_at.isoformat(),
            "total": round(s.total_vtl, 2),
            "HLT":   round(s.hlt_price, 2),
            "WLT":   round(s.wlt_price, 2),
            "SOC":   round(s.soc_price, 2),
        }
        for s in snaps
    ]

    totals     = [p["total"] for p in points]
    first_val  = totals[0]
    last_val   = totals[-1]
    change_pct = round(((last_val - first_val) / first_val * 100), 2) if first_val else 0

    return {
        "points": points,
        "summary": {
            "min":        round(min(totals), 2),
            "max":        round(max(totals), 2),
            "first":      round(first_val, 2),
            "last":       round(last_val, 2),
            "change_pct": change_pct,
        }
    }