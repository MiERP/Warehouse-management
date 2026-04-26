#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

REQUIRED_COUNTS = {
    "units": 3,
    "provinces": 2,
    "communes": 3,
    "catalog_items": 6,
    "warehouses": 1,
    "camera_systems": 1,
    "fire_systems": 1,
    "construction_projects": 1,
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate seeded SQLite MVP sample data.")
    parser.add_argument("--db", required=True, help="SQLite database path")
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    if not db_path.exists():
        raise SystemExit(f"Database not found: {db_path}")

    results: dict[str, int] = {}
    with sqlite3.connect(db_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        for table, minimum in REQUIRED_COUNTS.items():
            count = connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            if count < minimum:
                raise SystemExit(f"{table} has {count}, expected at least {minimum}")
            results[table] = count
        orphan_communes = connection.execute(
            "SELECT COUNT(*) FROM communes c LEFT JOIN provinces p ON p.id = c.province_id WHERE p.id IS NULL"
        ).fetchone()[0]
        if orphan_communes:
            raise SystemExit(f"Found {orphan_communes} communes without province")
        warehouse = connection.execute("SELECT name FROM warehouses WHERE code = 'KLB-001'").fetchone()
        if not warehouse:
            raise SystemExit("Sample warehouse KLB-001 missing")

    print(json.dumps({"database": str(db_path), "status": "ok", "counts": results}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
