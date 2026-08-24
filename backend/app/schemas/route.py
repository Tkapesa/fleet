from datetime import datetime

from pydantic import BaseModel, Field

from app.models.route import RouteStatus


class RouteCreate(BaseModel):
    reference: str = Field(min_length=1, max_length=80)
    origin: str = Field(min_length=1, max_length=255)
    destination: str = Field(min_length=1, max_length=255)
    truck_id: int
    driver_id: int
    cargo_description: str | None = None
    scheduled_departure: datetime
    estimated_arrival: datetime | None = None
    distance_miles: int | None = Field(default=None, ge=0)
    notes: str | None = None
    geometry: dict | list | None = None


class RouteUpdate(BaseModel):
    reference: str | None = Field(default=None, min_length=1, max_length=80)
    status: RouteStatus | None = None
    origin: str | None = Field(default=None, min_length=1, max_length=255)
    destination: str | None = Field(default=None, min_length=1, max_length=255)
    truck_id: int | None = None
    driver_id: int | None = None
    cargo_description: str | None = None
    scheduled_departure: datetime | None = None
    estimated_arrival: datetime | None = None
    distance_miles: int | None = Field(default=None, ge=0)
    notes: str | None = None


class RouteRead(BaseModel):
    id: int
    owner_user_id: int | None
    reference: str
    status: RouteStatus
    origin: str
    destination: str
    truck_id: int
    driver_id: int
    cargo_description: str | None
    scheduled_departure: datetime
    estimated_arrival: datetime | None
    distance_miles: int | None
    hazard_level: str | None
    hazard_summary: str | None
    hazard_details: str | None
    notes: str | None
    geometry: dict | list | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
