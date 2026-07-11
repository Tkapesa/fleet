from pydantic import BaseModel
from app.models.truck import TruckStatus


class TruckCreate(BaseModel):
    license_plate: str
    make: str
    model: str
    year: int
    capacity_tons: float


class TruckUpdate(BaseModel):
    make: str | None = None
    model: str | None = None
    year: int | None = None
    capacity_tons: float | None = None
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
    status: TruckStatus
    mileage_km: float
    is_active: bool

    model_config = {"from_attributes": True}


class TruckSpendingSummary(BaseModel):
    truck_id: int
    license_plate: str
    maintenance_total: float
    ifta_tax_total: float
    total_spent: float
