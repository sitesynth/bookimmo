#!/usr/bin/env python3
"""
Import a backend snapshot JSON into a target PostgreSQL database.

Target connection is read from standard env vars:
  DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import Json


TABLE_ORDER = [
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


def get_target_connection():
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if database_url:
        return psycopg2.connect(database_url)

    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("DB_PORT", "5432")),
        database=os.environ.get("DB_NAME", "bookimmo_backend"),
        user=os.environ.get("DB_USER", "bookimmo_backend"),
        password=os.environ.get("DB_PASSWORD", ""),
    )


def to_param(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return Json(value)
    return value


def truncate_table(cur, table: str) -> None:
    cur.execute(f"truncate table public.{table} restart identity cascade")


def insert_rows(cur, table: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return

    columns = list(rows[0].keys())
    column_sql = ", ".join(columns)
    placeholder_sql = ", ".join(["%s"] * len(columns))
    sql = f"insert into public.{table} ({column_sql}) values ({placeholder_sql})"

    for row in rows:
        cur.execute(sql, [to_param(row[column]) for column in columns])


def main() -> None:
    snapshot_arg = os.environ.get("BOOKIMMO_SNAPSHOT_PATH")
    if not snapshot_arg:
        raise SystemExit("Set BOOKIMMO_SNAPSHOT_PATH to the exported snapshot JSON path.")

    snapshot_path = Path(snapshot_arg)
    payload = json.loads(snapshot_path.read_text(encoding="utf-8"))
    tables = payload.get("tables", {})

    conn = get_target_connection()
    cur = conn.cursor()
    try:
        for table in TABLE_ORDER:
            rows = tables.get(table, {}).get("rows", [])
            truncate_table(cur, table)
            insert_rows(cur, table, rows)
            print(f"{table}: {len(rows)}")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
