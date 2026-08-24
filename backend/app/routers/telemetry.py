from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.alert import AlertSeverity
from app.models.geofence import Geofence
from app.models.telemetry_event import TelemetryEvent
from app.models.truck import Truck
from app.models.user import User
from app.schemas.telemetry import TelemetryHeartbeat, TelemetryRead
from app.services.alerts import create_alert

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

IDLE_SPEED_THRESHOLD_KPH = 2.0
IDLE_MINUTES_DEFAULT = 30


def _as_utc(ts: datetime) -> datetime:
    if ts.tzinfo is None:
        return ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc)


def _in_working_hours(ts: datetime) -> bool:
    start_hour = settings.WORKDAY_START_HOUR
    end_hour = settings.WORKDAY_END_HOUR
    return start_hour <= ts.hour < end_hour


def _resolve_truck(db: Session, truck_id: int, current_user: User) -> Truck | None:
    if current_user.company_id:
        return db.query(Truck).filter(Truck.id == truck_id, Truck.company_id == current_user.company_id).first()
    return db.query(Truck).filter(Truck.id == truck_id, Truck.owner_user_id == current_user.id).first()


@router.post("/trucks/{truck_id}/heartbeat", response_model=TelemetryRead, status_code=status.HTTP_201_CREATED)
def ingest_heartbeat(
    truck_id: int,
    payload: TelemetryHeartbeat,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    truck = _resolve_truck(db, truck_id, current_user)
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    recorded_at = _as_utc(payload.recorded_at) if payload.recorded_at else datetime.now(timezone.utc)
    event = TelemetryEvent(
        owner_user_id=current_user.id,
        company_id=current_user.company_id,
        truck_id=truck.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kph=payload.speed_kph,
        heading_degrees=payload.heading_degrees,
        odometer_km=payload.odometer_km,
        ignition_on=payload.ignition_on,
        recorded_at=recorded_at,
    )
    db.add(event)

    truck.latitude = payload.latitude
    truck.longitude = payload.longitude
    truck.last_telemetry_at = recorded_at

    if payload.odometer_km is not None and payload.odometer_km >= (truck.mileage_km or 0):
        truck.mileage_km = payload.odometer_km

    if payload.speed_kph > IDLE_SPEED_THRESHOLD_KPH:
        truck.last_movement_at = recorded_at
    else:
        idle_minutes = settings.IDLE_ALERT_MINUTES or IDLE_MINUTES_DEFAULT
        if truck.last_movement_at and _in_working_hours(recorded_at):
            idle_duration = recorded_at - _as_utc(truck.last_movement_at)
            if idle_duration >= timedelta(minutes=idle_minutes):
                create_alert(
                    db,
                    owner_user_id=current_user.id,
                    company_id=current_user.company_id,
                    source="idle_detection",
                    severity=AlertSeverity.warning,
                    title="Truck idle too long",
                    message=f"Truck {truck.license_plate} has been idle for {int(idle_duration.total_seconds() // 60)} minutes during working hours.",
                    truck_id=truck.id,
                    metadata={"idle_minutes": int(idle_duration.total_seconds() // 60)},
                )

    # inline geofence enforcement for newly ingested position
    if current_user.company_id:
        geofences = db.query(Geofence).filter(Geofence.company_id == current_user.company_id, Geofence.is_active == True).all()
    else:
        geofences = db.query(Geofence).filter(Geofence.owner_user_id == current_user.id, Geofence.is_active == True).all()

    for geofence in geofences:
        if geofence.truck_id is not None and geofence.truck_id != truck.id:
            continue

        lat_diff = abs(payload.latitude - geofence.center_latitude)
        lon_diff = abs(payload.longitude - geofence.center_longitude)
        approx_distance_m = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111000
        if approx_distance_m > geofence.radius_meters:
            create_alert(
                db,
                owner_user_id=current_user.id,
                company_id=current_user.company_id,
                source="geofence",
                severity=AlertSeverity.critical,
                title="Geofence breach",
                message=f"Truck {truck.license_plate} is outside geofence '{geofence.name}'.",
                truck_id=truck.id,
                metadata={"geofence_id": geofence.id, "approx_distance_m": round(approx_distance_m, 2)},
            )

    db.commit()
    db.refresh(event)
    return event


@router.get("/trucks/{truck_id}/history", response_model=list[TelemetryRead])
def telemetry_history(
    truck_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    truck = _resolve_truck(db, truck_id, current_user)
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    if current_user.company_id:
        q = db.query(TelemetryEvent).filter(TelemetryEvent.truck_id == truck_id, TelemetryEvent.company_id == current_user.company_id)
    else:
        q = db.query(TelemetryEvent).filter(TelemetryEvent.truck_id == truck_id, TelemetryEvent.owner_user_id == current_user.id)
    return q.order_by(TelemetryEvent.recorded_at.desc()).limit(limit).all()
