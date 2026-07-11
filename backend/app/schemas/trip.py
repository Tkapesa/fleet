from datetime import datetime
from pydantic import BaseModel
from app.models.trip import TripStatus


class TripCreate(BaseModel):
    truck_id: int
    driver_id: int
    origin: str
    destination: str
    cargo_description: str | None = None
    cargo_weight_tons: float | None = None
    scheduled_departure: datetime
    notes: str | None = None


class TripUpdate(BaseModel):
    origin: str | None = None
    destination: str | None = None
    cargo_description: str | None = None
    cargo_weight_tons: float | None = None
    status: TripStatus | None = None
    scheduled_departure: datetime | None = None
    actual_departure: datetime | None = None
    actual_arrival: datetime | None = None
    notes: str | None = None


class TripRead(BaseModel):
    id: int
    truck_id: int
    driver_id: int
    origin: str
    destination: str
    cargo_description: str | None
    cargo_weight_tons: float | None
    status: TripStatus
    scheduled_departure: datetime
    actual_departure: datetime | None
    actual_arrival: datetime | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
