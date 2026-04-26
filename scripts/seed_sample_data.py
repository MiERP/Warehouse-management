#!/usr/bin/env python3
"""Create a SQLite schema from current SQLAlchemy models and load sample MVP data.

This script is for development/test databases only. The production installer must still
create the real database only after the setup wizard confirmation.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_FIXTURE = ROOT_DIR / "tests" / "fixtures" / "sample_seed_data.json"

CREATE_TABLES_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  parent_id INTEGER REFERENCES units(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS provinces (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS communes (
  id INTEGER PRIMARY KEY,
  province_id INTEGER NOT NULL REFERENCES provinces(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id INTEGER PRIMARY KEY,
  category VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(80),
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  CONSTRAINT uq_catalog_category_code UNIQUE (category, code)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(80) UNIQUE,
  unit_id INTEGER REFERENCES units(id),
  province_id INTEGER REFERENCES provinces(id),
  commune_id INTEGER REFERENCES communes(id),
  address VARCHAR(500),
  warehouse_type_id INTEGER REFERENCES catalog_items(id),
  goods_type_id INTEGER REFERENCES catalog_items(id),
  quality_id INTEGER REFERENCES catalog_items(id),
  area FLOAT,
  capacity FLOAT,
  stock_level FLOAT,
  fire_status TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS camera_systems (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  warehouse_id INTEGER REFERENCES warehouses(id),
  unit_id INTEGER REFERENCES units(id),
  camera_count INTEGER,
  monitor_count INTEGER,
  installed_year INTEGER,
  repaired_year INTEGER,
  investor VARCHAR(255),
  status VARCHAR(255),
  repair_need TEXT,
  new_install_need TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS fire_systems (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  warehouse_id INTEGER REFERENCES warehouses(id),
  unit_id INTEGER REFERENCES units(id),
  system_type_id INTEGER REFERENCES catalog_items(id),
  lightning_protection_type_id INTEGER REFERENCES catalog_items(id),
  equipment_status TEXT,
  repair_need TEXT,
  new_install_need TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS construction_projects (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_type VARCHAR(50) NOT NULL,
  warehouse_id INTEGER REFERENCES warehouses(id),
  unit_id INTEGER REFERENCES units(id),
  progress VARCHAR(255),
  budget FLOAT,
  responsible_unit VARCHAR(255),
  start_year INTEGER,
  end_year INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);
"""

TABLES = [
    "units",
    "provinces",
    "communes",
    "catalog_items",
    "warehouses",
    "camera_systems",
    "fire_systems",
    "construction_projects",
]


def upsert_rows(connection: sqlite3.Connection, table: str, rows: list[dict[str, Any]]) -> None:
    for row in rows:
        columns = list(row.keys())
        placeholders = ", ".join([":" + column for column in columns])
        assignments = ", ".join([f"{column}=excluded.{column}" for column in columns if column != "id"])
        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders}) ON CONFLICT(id) DO UPDATE SET {assignments}"
        connection.execute(sql, row)


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed a development/test SQLite database with MVP sample data.")
    parser.add_argument("--db", default=str(ROOT_DIR / "database" / "dev.db"), help="SQLite database path")
    parser.add_argument("--fixture", default=str(DEFAULT_FIXTURE), help="Seed fixture JSON path")
    parser.add_argument("--include-admin", action="store_true", help="Insert placeholder admin row for tests only")
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    fixture_path = Path(args.fixture).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    data = json.loads(fixture_path.read_text(encoding="utf-8"))
    with sqlite3.connect(db_path) as connection:
        connection.executescript(CREATE_TABLES_SQL)
        if args.include_admin:
            admin = data["admin"]
            connection.execute(
                "INSERT INTO admin_users (id, username, password_hash) VALUES (1, :username, :password_hash) "
                "ON CONFLICT(id) DO UPDATE SET username=excluded.username, password_hash=excluded.password_hash",
                admin,
            )
        for table in TABLES:
            upsert_rows(connection, table, data.get(table, []))
        connection.commit()

    print(json.dumps({"database": str(db_path), "fixture": str(fixture_path), "tables_seeded": TABLES}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
