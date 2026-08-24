from datetime import datetime

from pydantic import BaseModel, Field


class GeofenceCreate(BaseModel):
    name: str
    truck_id: int | None = None
    center_latitude: float = Field(ge=-90, le=90)
    center_longitude: float = Field(ge=-180, le=180)
    radius_meters: float = Field(gt=0)


class GeofenceUpdate(BaseModel):
    name: str | None = None
    truck_id: int | None = None
    center_latitude: float | None = Field(default=None, ge=-90, le=90)
    center_longitude: float | None = Field(default=None, ge=-180, le=180)
    radius_meters: float | None = Field(default=None, gt=0)
    is_active: bool | None = None


class GeofenceRead(BaseModel):
    id: int
    truck_id: int | None
    name: str
    center_latitude: float
    center_longitude: float
    radius_meters: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
