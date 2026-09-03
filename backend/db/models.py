"""
VitalityX — Database Models
SQLite via SQLAlchemy. Zero config, runs locally instantly.
Indexes added on all hot query paths.
"""

from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Index
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = "sqlite:///./vitalityx.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


# ── Models (all defined before init_db) ──────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id             = Column(String, primary_key=True)
    name           = Column(String, nullable=False)
    local_currency = Column(String, default="₹")
    created_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class StockState(Base):
    __tablename__ = "stock_states"

    id             = Column(String, primary_key=True)
    user_id        = Column(String, nullable=False)
    ticker         = Column(String, nullable=False)
    current_price  = Column(Float, default=1000.0)
    previous_price = Column(Float, default=1000.0)
    peak_price     = Column(Float, default=1000.0)
    streak_days    = Column(Integer, default=0)
    last_activity_at = Column(DateTime, nullable=True)
    last_activity_date = Column(String, nullable=True)  # YYYY-MM-DD — streak dedup
    last_reprice_at  = Column(DateTime, nullable=True)  # throttle reprice on GET
    last_updated   = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_stock_states_user_ticker", "user_id", "ticker"),
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id            = Column(String, primary_key=True)
    user_id       = Column(String, nullable=False)
    ticker        = Column(String, nullable=False)
    activity_type = Column(String, nullable=False)
    vtl_gained    = Column(Float, default=0.0)
    logged_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    note          = Column(String, nullable=True)

    __table_args__ = (
        Index("ix_activity_logs_user_ticker", "user_id", "ticker"),
        Index("ix_activity_logs_user_logged", "user_id", "logged_at"),
    )


class SparklinePoint(Base):
    __tablename__ = "sparkline_points"

    id          = Column(String, primary_key=True)
    user_id     = Column(String, nullable=False)
    ticker      = Column(String, nullable=False)
    price       = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_sparkline_user_ticker_time", "user_id", "ticker", "recorded_at"),
    )


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id          = Column(String, primary_key=True)
    user_id     = Column(String, nullable=False)
    total_vtl   = Column(Float, nullable=False)
    hlt_price   = Column(Float, default=0.0)
    wlt_price   = Column(Float, default=0.0)
    soc_price   = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_portfolio_snapshots_user_time", "user_id", "recorded_at"),
    )


# ── DB helpers ────────────────────────────────────────────────────────────────

def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()