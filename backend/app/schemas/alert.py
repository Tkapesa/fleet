from datetime import datetime

from pydantic import BaseModel

from app.models.alert import AlertSeverity, AlertStatus


class AlertRead(BaseModel):
    id: int
    truck_id: int | None
    driver_id: int | None
    route_id: int | None
    source: str
    severity: AlertSeverity
    status: AlertStatus
    title: str
    message: str
    metadata_json: str | None
    created_at: datetime
    acknowledged_at: datetime | None

    model_config = {"from_attributes": True}


class AlertAcknowledge(BaseModel):
    status: AlertStatus = AlertStatus.acknowledged
