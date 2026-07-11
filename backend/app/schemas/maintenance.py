from datetime import datetime

from pydantic import BaseModel, Field


class MaintenanceServiceCreate(BaseModel):
    truck_id: int
    service_date: datetime
    service_type: str
    vendor: str | None = None
    mileage_km: float | None = None
    cost: float = Field(gt=0)
    notes: str | None = None


class MaintenanceServiceUpdate(BaseModel):
    service_date: datetime | None = None
    service_type: str | None = None
    vendor: str | None = None
    mileage_km: float | None = None
    cost: float | None = Field(default=None, gt=0)
    notes: str | None = None


class MaintenanceServiceRead(BaseModel):
    id: int
    truck_id: int
    service_date: datetime
    service_type: str
    vendor: str | None
    mileage_km: float | None
    cost: float
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}