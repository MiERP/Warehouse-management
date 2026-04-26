from __future__ import annotations

import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DEFAULT_DB_PATH = Path(__file__).resolve().parents[3] / "database" / "warehouse.db"
DATABASE_URL = os.getenv("WAREHOUSE_DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")


def _create_engine(database_url: str) -> Engine:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args)


engine = _create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def configure_sqlite_database(database_path: Path) -> None:
    global DATABASE_URL, engine, SessionLocal
    database_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{database_path}"
    engine.dispose()
    engine = _create_engine(DATABASE_URL)
    SessionLocal.configure(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
