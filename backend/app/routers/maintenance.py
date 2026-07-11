from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.maintenance import MaintenanceService
from app.models.truck import Truck
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceServiceCreate,
    MaintenanceServiceRead,
    MaintenanceServiceUpdate,
)

router = APIRouter(prefix="/maintenance-services", tags=["maintenance-services"])


@router.get("/", response_model=list[MaintenanceServiceRead])
def list_maintenance_services(
    truck_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MaintenanceService).filter(MaintenanceService.owner_user_id == current_user.id)
    if truck_id is not None:
        query = query.filter(MaintenanceService.truck_id == truck_id)
    return query.order_by(MaintenanceService.service_date.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=MaintenanceServiceRead, status_code=status.HTTP_201_CREATED)
def create_maintenance_service(
    payload: MaintenanceServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    truck = (
        db.query(Truck)
        .filter(Truck.id == payload.truck_id, Truck.owner_user_id == current_user.id)
        .first()
    )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    service = MaintenanceService(**payload.model_dump(), owner_user_id=current_user.id)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.get("/{service_id}", response_model=MaintenanceServiceRead)
def get_maintenance_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(MaintenanceService)
        .filter(MaintenanceService.id == service_id, MaintenanceService.owner_user_id == current_user.id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Maintenance service not found")
    return service


@router.patch("/{service_id}", response_model=MaintenanceServiceRead)
def update_maintenance_service(
    service_id: int,
    payload: MaintenanceServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(MaintenanceService)
        .filter(MaintenanceService.id == service_id, MaintenanceService.owner_user_id == current_user.id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Maintenance service not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(MaintenanceService)
        .filter(MaintenanceService.id == service_id, MaintenanceService.owner_user_id == current_user.id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Maintenance service not found")

    db.delete(service)
    db.commit()