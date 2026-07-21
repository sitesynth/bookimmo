#!/usr/bin/env python3
"""
Export a full backend database snapshot to JSON.

By default it reads connection params from backend/.env via backend/config.py.
This is useful for extracting live data from Supabase once and then migrating
away from it permanently.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor

import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import config  # noqa: E402

TABLES = [
    "contacts",
    "apartments",
    "apartment_timeline",
    "apartment_replies",
    "user_messages",
    "app_users",
    "profiles",
    "favorites",
    "saved_searches",
    "applications",
    "listings_cache",
]


def normalize(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
      return value.isoformat()
    if isinstance(value, Decimal):
      return float(value)
    if isinstance(value, dict):
      return {key: normalize(val) for key, val in value.items()}
    if isinstance(value, list):
      return [normalize(item) for item in value]
    return value


def main() -> None:
    snapshot_dir = ROOT / "checkpoints"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    snapshot_path = snapshot_dir / f"backend_snapshot_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.json"

    conn = psycopg2.connect(**config.get_db_connection_params())
    cur = conn.cursor(cursor_factory=RealDictCursor)

    payload: dict[str, Any] = {
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "source": {
            "host": config.DB_HOST,
            "port": config.DB_PORT,
            "database": config.DB_NAME,
            "user": config.DB_USER,
        },
        "tables": {},
    }

    try:
        for table in TABLES:
            cur.execute(f"select * from public.{table}")
            rows = [normalize(dict(row)) for row in cur.fetchall()]
            payload["tables"][table] = {
                "count": len(rows),
                "rows": rows,
            }
    finally:
        cur.close()
        conn.close()

    snapshot_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(str(snapshot_path))


if __name__ == "__main__":
    main()
