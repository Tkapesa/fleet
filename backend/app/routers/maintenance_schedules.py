from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.alert import AlertSeverity
from app.models.maintenance_schedule import MaintenanceSchedule
from app.models.truck import Truck
from app.models.user import User
from app.schemas.maintenance_schedule import (
    MaintenanceScheduleCreate,
    MaintenanceScheduleRead,
    MaintenanceScheduleUpdate,
)
from app.services.alerts import create_alert

router = APIRouter(prefix="/maintenance-schedules", tags=["maintenance-schedules"])


def _resolve_truck(db: Session, truck_id: int, current_user: User) -> Truck | None:
    if current_user.company_id:
        return db.query(Truck).filter(Truck.id == truck_id, Truck.company_id == current_user.company_id).first()
    return db.query(Truck).filter(Truck.id == truck_id, Truck.owner_user_id == current_user.id).first()


def _calculate_next_due(schedule: MaintenanceSchedule, truck: Truck) -> None:
    schedule.next_due_date = None
    schedule.next_due_km = None

    if schedule.interval_days and schedule.last_service_date:
        schedule.next_due_date = schedule.last_service_date + timedelta(days=schedule.interval_days)

    if schedule.interval_km and schedule.last_service_km is not None:
        schedule.next_due_km = schedule.last_service_km + schedule.interval_km


def _is_due(schedule: MaintenanceSchedule, truck: Truck) -> tuple[bool, str]:
    if schedule.next_due_date and truck.last_telemetry_at and truck.last_telemetry_at >= schedule.next_due_date:
        return True, "date"
    if schedule.next_due_km is not None and truck.mileage_km is not None and truck.mileage_km >= schedule.next_due_km:
        return True, "mileage"
    return False, ""


@router.get("/", response_model=list[MaintenanceScheduleRead])
def list_schedules(
    truck_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        query = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.company_id == current_user.company_id)
    else:
        query = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.owner_user_id == current_user.id)

    if truck_id is not None:
        query = query.filter(MaintenanceSchedule.truck_id == truck_id)

    return query.order_by(MaintenanceSchedule.created_at.desc()).all()


@router.post("/", response_model=MaintenanceScheduleRead, status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: MaintenanceScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    truck = _resolve_truck(db, payload.truck_id, current_user)
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    schedule = MaintenanceSchedule(
        owner_user_id=current_user.id,
        company_id=current_user.company_id,
        truck_id=payload.truck_id,
        service_type=payload.service_type,
        interval_days=payload.interval_days,
        interval_km=payload.interval_km,
        last_service_date=payload.last_service_date,
        last_service_km=payload.last_service_km,
    )
    _calculate_next_due(schedule, truck)

    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}", response_model=MaintenanceScheduleRead)
def update_schedule(
    schedule_id: int,
    payload: MaintenanceScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id, MaintenanceSchedule.company_id == current_user.company_id).first()
    else:
        schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id, MaintenanceSchedule.owner_user_id == current_user.id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")

    truck = _resolve_truck(db, schedule.truck_id, current_user)
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    _calculate_next_due(schedule, truck)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.post("/check-due")
def check_due_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        schedules = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.company_id == current_user.company_id, MaintenanceSchedule.is_active == True).all()
    else:
        schedules = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.owner_user_id == current_user.id, MaintenanceSchedule.is_active == True).all()

    due_count = 0
    for schedule in schedules:
        truck = _resolve_truck(db, schedule.truck_id, current_user)
        if not truck:
            continue

        is_due, basis = _is_due(schedule, truck)
        if not is_due:
            continue

        due_count += 1
        create_alert(
            db,
            owner_user_id=current_user.id,
            company_id=current_user.company_id,
            source="maintenance_schedule",
            severity=AlertSeverity.warning,
            title="Maintenance due",
            message=f"Truck {truck.license_plate} needs {schedule.service_type} maintenance ({basis}-based trigger).",
            truck_id=truck.id,
            metadata={"schedule_id": schedule.id, "basis": basis},
        )

    db.commit()
    return {"due_alerts_created": due_count}
