from datetime import datetime

from pydantic import BaseModel
from app.models.truck import TruckStatus


class TruckCreate(BaseModel):
    license_plate: str
    make: str
    model: str
    year: int
    capacity_tons: float
    height_m: float | None = None
    length_m: float | None = None
    latitude: float | None = None
    longitude: float | None = None


class TruckUpdate(BaseModel):
    make: str | None = None
    model: str | None = None
    year: int | None = None
    capacity_tons: float | None = None
    height_m: float | None = None
    length_m: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: TruckStatus | None = None
    mileage_km: float | None = None
    is_active: bool | None = None


class TruckRead(BaseModel):
    id: int
    license_plate: str
    make: str
    model: str
    year: int
    capacity_tons: float
    height_m: float | None
    length_m: float | None
    status: TruckStatus
    mileage_km: float
    latitude: float | None
    longitude: float | None
    last_telemetry_at: datetime | None
    last_movement_at: datetime | None
    is_active: bool

    model_config = {"from_attributes": True}


class TruckSpendingSummary(BaseModel):
    truck_id: int
    license_plate: str
    maintenance_total: float
    ifta_tax_total: float
    total_spent: float
