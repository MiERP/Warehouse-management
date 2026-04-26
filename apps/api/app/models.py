from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, default="admin")
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), unique=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    parent = relationship("Unit", remote_side=[id])


class Province(Base):
    __tablename__ = "provinces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Commune(Base):
    __tablename__ = "communes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    province_id: Mapped[int] = mapped_column(ForeignKey("provinces.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    province = relationship("Province")


class CatalogItem(Base):
    __tablename__ = "catalog_items"
    __table_args__ = (UniqueConstraint("category", "code", name="uq_catalog_category_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code: Mapped[str | None] = mapped_column(String(80), unique=True)
    unit_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"))
    province_id: Mapped[int | None] = mapped_column(ForeignKey("provinces.id"))
    commune_id: Mapped[int | None] = mapped_column(ForeignKey("communes.id"))
    address: Mapped[str | None] = mapped_column(String(500))
    warehouse_type_id: Mapped[int | None] = mapped_column(ForeignKey("catalog_items.id"))
    goods_type_id: Mapped[int | None] = mapped_column(ForeignKey("catalog_items.id"))
    quality_id: Mapped[int | None] = mapped_column(ForeignKey("catalog_items.id"))
    area: Mapped[float | None] = mapped_column(Float)
    capacity: Mapped[float | None] = mapped_column(Float)
    stock_level: Mapped[float | None] = mapped_column(Float)
    fire_status: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)


class CameraSystem(Base):
    __tablename__ = "camera_systems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"))
    camera_count: Mapped[int | None] = mapped_column(Integer)
    monitor_count: Mapped[int | None] = mapped_column(Integer)
    installed_year: Mapped[int | None] = mapped_column(Integer)
    repaired_year: Mapped[int | None] = mapped_column(Integer)
    investor: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str | None] = mapped_column(String(255))
    repair_need: Mapped[str | None] = mapped_column(Text)
    new_install_need: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)


class FireSystem(Base):
    __tablename__ = "fire_systems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"))
    system_type_id: Mapped[int | None] = mapped_column(ForeignKey("catalog_items.id"))
    lightning_protection_type_id: Mapped[int | None] = mapped_column(ForeignKey("catalog_items.id"))
    equipment_status: Mapped[str | None] = mapped_column(Text)
    repair_need: Mapped[str | None] = mapped_column(Text)
    new_install_need: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)


class ConstructionProject(Base):
    __tablename__ = "construction_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    project_type: Mapped[str] = mapped_column(String(50), nullable=False)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"))
    unit_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"))
    progress: Mapped[str | None] = mapped_column(String(255))
    budget: Mapped[float | None] = mapped_column(Float)
    responsible_unit: Mapped[str | None] = mapped_column(String(255))
    start_year: Mapped[int | None] = mapped_column(Integer)
    end_year: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime)


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
