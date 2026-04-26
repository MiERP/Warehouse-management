from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SetupInit(BaseModel):
    database_path: str | None = None
    database_name: str | None = "warehouse.db"
    confirm: bool


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=4)


class UnitIn(BaseModel):
    name: str
    code: str | None = None
    parent_id: int | None = None
    sort_order: int = 0
    is_active: bool = True


class UnitOut(UnitIn, ORMModel):
    id: int


class ProvinceIn(BaseModel):
    name: str
    code: str | None = None
    is_active: bool = True


class ProvinceOut(ProvinceIn, ORMModel):
    id: int


class CommuneIn(BaseModel):
    province_id: int
    name: str
    code: str | None = None
    is_active: bool = True


class CommuneOut(CommuneIn, ORMModel):
    id: int


class CatalogIn(BaseModel):
    category: str
    name: str
    code: str | None = None
    description: str | None = None
    is_active: bool = True


class CatalogOut(CatalogIn, ORMModel):
    id: int


def validate_non_negative(value: float | int | None) -> float | int | None:
    if value is not None and value < 0:
        raise ValueError("must be non-negative")
    return value


def validate_year(value: int | None) -> int | None:
    if value is not None and (value < 1900 or value > 2200):
        raise ValueError("year must be between 1900 and 2200")
    return value


class WarehouseIn(BaseModel):
    name: str
    code: str | None = None
    unit_id: int | None = None
    province_id: int | None = None
    commune_id: int | None = None
    address: str | None = None
    warehouse_type_id: int | None = None
    goods_type_id: int | None = None
    quality_id: int | None = None
    area: float | None = None
    capacity: float | None = None
    stock_level: float | None = None
    fire_status: str | None = None
    notes: str | None = None

    _non_negative = field_validator("area", "capacity", "stock_level")(validate_non_negative)


class WarehouseOut(WarehouseIn, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class CameraIn(BaseModel):
    name: str = "Hệ thống camera"
    warehouse_id: int | None = None
    unit_id: int | None = None
    camera_count: int | None = None
    monitor_count: int | None = None
    installed_year: int | None = None
    repaired_year: int | None = None
    investor: str | None = None
    status: str | None = None
    repair_need: str | None = None
    new_install_need: str | None = None
    notes: str | None = None

    _non_negative = field_validator("camera_count", "monitor_count")(validate_non_negative)
    _valid_year = field_validator("installed_year", "repaired_year")(validate_year)


class CameraOut(CameraIn, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class FireIn(BaseModel):
    name: str = "Hệ thống cứu hỏa"
    warehouse_id: int | None = None
    unit_id: int | None = None
    system_type_id: int | None = None
    lightning_protection_type_id: int | None = None
    equipment_status: str | None = None
    repair_need: str | None = None
    new_install_need: str | None = None
    notes: str | None = None


class FireOut(FireIn, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class ConstructionIn(BaseModel):
    name: str
    project_type: str
    warehouse_id: int | None = None
    unit_id: int | None = None
    progress: str | None = None
    budget: float | None = None
    responsible_unit: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    notes: str | None = None

    _non_negative = field_validator("budget")(validate_non_negative)
    _valid_year = field_validator("start_year", "end_year")(validate_year)


class ConstructionOut(ConstructionIn, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class AttachmentOut(ORMModel):
    id: int
    entity_type: str
    entity_id: int
    original_name: str
    stored_name: str
    content_type: str | None
    size: int
    created_at: datetime


class ImportResult(BaseModel):
    imported: int
    errors: list[dict[str, Any]] = []
