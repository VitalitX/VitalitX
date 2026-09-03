"""
VitalityX — Migration Script
Run once: python3 migrate.py
Adds new columns and indexes to existing DB without losing data.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "vitalityx.db")

def run():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()

    print(f"Migrating: {DB_PATH}")

    # Add new columns (safe to re-run — catches existing column errors)
    migrations = [
        ("stock_states", "last_activity_date", "TEXT"),
        ("stock_states", "last_reprice_at",    "DATETIME"),
    ]

    for table, col, col_type in migrations:
        try:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            print(f"  + {table}.{col}")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e):
                print(f"  ✓ {table}.{col} already exists")
            else:
                raise

    # Backfill last_activity_date from last_activity_at
    cur.execute("""
        UPDATE stock_states
        SET last_activity_date = substr(last_activity_at, 1, 10)
        WHERE last_activity_at IS NOT NULL
          AND last_activity_date IS NULL
    """)
    print(f"  Backfilled last_activity_date for {cur.rowcount} rows")

    # Create indexes
    indexes = [
        ("ix_stock_states_user_ticker",      "stock_states(user_id, ticker)"),
        ("ix_activity_logs_user_ticker",     "activity_logs(user_id, ticker)"),
        ("ix_activity_logs_user_logged",     "activity_logs(user_id, logged_at)"),
        ("ix_sparkline_user_ticker_time",    "sparkline_points(user_id, ticker, recorded_at)"),
        ("ix_portfolio_snapshots_user_time", "portfolio_snapshots(user_id, recorded_at)"),
    ]

    for name, definition in indexes:
        cur.execute(f"CREATE INDEX IF NOT EXISTS {name} ON {definition}")
        print(f"  ✓ index {name}")

    conn.commit()
    conn.close()
    print("\nMigration complete. Restart uvicorn.")

if __name__ == "__main__":
    run()