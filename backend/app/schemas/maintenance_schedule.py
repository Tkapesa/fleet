from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class MaintenanceScheduleCreate(BaseModel):
    truck_id: int
    service_type: str
    interval_days: int | None = Field(default=None, ge=1)
    interval_km: float | None = Field(default=None, gt=0)
    last_service_date: datetime | None = None
    last_service_km: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_intervals(self):
        if self.interval_days is None and self.interval_km is None:
            raise ValueError("At least one of interval_days or interval_km is required")
        return self


class MaintenanceScheduleUpdate(BaseModel):
    service_type: str | None = None
    interval_days: int | None = Field(default=None, ge=1)
    interval_km: float | None = Field(default=None, gt=0)
    last_service_date: datetime | None = None
    last_service_km: float | None = Field(default=None, ge=0)
    is_active: bool | None = None


class MaintenanceScheduleRead(BaseModel):
    id: int
    truck_id: int
    service_type: str
    interval_days: int | None
    interval_km: float | None
    last_service_date: datetime | None
    last_service_km: float | None
    next_due_date: datetime | None
    next_due_km: float | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
