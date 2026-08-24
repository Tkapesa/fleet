from datetime import datetime

from pydantic import BaseModel, Field


class TelemetryHeartbeat(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    speed_kph: float = Field(default=0.0, ge=0)
    heading_degrees: float | None = Field(default=None, ge=0, le=360)
    odometer_km: float | None = Field(default=None, ge=0)
    ignition_on: bool | None = None
    recorded_at: datetime | None = None


class TelemetryRead(BaseModel):
    id: int
    truck_id: int
    latitude: float
    longitude: float
    speed_kph: float
    heading_degrees: float | None
    odometer_km: float | None
    ignition_on: bool | None
    recorded_at: datetime

    model_config = {"from_attributes": True}
