from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.ifta import IFTARecord
from app.models.maintenance import MaintenanceService
from app.models.truck import Truck
from app.models.user import User
from app.schemas.truck import TruckCreate, TruckRead, TruckSpendingSummary, TruckUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/trucks", tags=["trucks"])


@router.get("/spending/summary", response_model=list[TruckSpendingSummary])
def get_truck_spending_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        maint_filter = MaintenanceService.company_id == current_user.company_id
    else:
        maint_filter = MaintenanceService.owner_user_id == current_user.id

    maintenance_totals = (
        db.query(
            MaintenanceService.truck_id.label("truck_id"),
            func.coalesce(func.sum(MaintenanceService.cost), 0.0).label("maintenance_total"),
        )
        .filter(maint_filter)
        .group_by(MaintenanceService.truck_id)
        .subquery()
    )

    taxable_gallons_expr = case(
        (
            ((IFTARecord.miles_driven / IFTARecord.fleet_mpg) - IFTARecord.gallons_purchased) > 0,
            (IFTARecord.miles_driven / IFTARecord.fleet_mpg) - IFTARecord.gallons_purchased,
        ),
        else_=0.0,
    )

    if current_user.company_id:
        ifta_filter = IFTARecord.company_id == current_user.company_id
    else:
        ifta_filter = IFTARecord.owner_user_id == current_user.id

    ifta_tax_totals = (
        db.query(
            IFTARecord.truck_id.label("truck_id"),
            func.coalesce(
                func.sum(taxable_gallons_expr * IFTARecord.tax_rate_per_gallon),
                0.0,
            ).label("ifta_tax_total"),
        )
        .filter(
            ifta_filter,
            IFTARecord.fleet_mpg.is_not(None),
            IFTARecord.fleet_mpg > 0,
        )
        .group_by(IFTARecord.truck_id)
        .subquery()
    )

    if current_user.company_id:
        truck_filter = Truck.company_id == current_user.company_id
    else:
        truck_filter = Truck.owner_user_id == current_user.id

    rows = (
        db.query(
            Truck.id,
            Truck.license_plate,
            func.coalesce(maintenance_totals.c.maintenance_total, 0.0),
            func.coalesce(ifta_tax_totals.c.ifta_tax_total, 0.0),
        )
        .outerjoin(maintenance_totals, maintenance_totals.c.truck_id == Truck.id)
        .outerjoin(ifta_tax_totals, ifta_tax_totals.c.truck_id == Truck.id)
        .filter(truck_filter)
        .all()
    )

    result: list[TruckSpendingSummary] = []
    for truck_id, license_plate, maintenance_total, ifta_tax_total in rows:
        total_spent = float(maintenance_total or 0.0) + float(ifta_tax_total or 0.0)
        result.append(
            TruckSpendingSummary(
                truck_id=truck_id,
                license_plate=license_plate,
                maintenance_total=round(float(maintenance_total or 0.0), 2),
                ifta_tax_total=round(float(ifta_tax_total or 0.0), 2),
                total_spent=round(total_spent, 2),
            )
        )
    return result


@router.get("/", response_model=list[TruckRead])
def list_trucks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        base_q = db.query(Truck).filter(Truck.company_id == current_user.company_id)
    else:
        base_q = db.query(Truck).filter(Truck.owner_user_id == current_user.id)
    return base_q.offset(skip).limit(limit).all()


@router.post("/", response_model=TruckRead, status_code=status.HTTP_201_CREATED)
def create_truck(
    payload: TruckCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Truck).filter(Truck.license_plate == payload.license_plate).first()
    if existing:
        raise HTTPException(status_code=409, detail="License plate already registered")
    truck = Truck(**payload.model_dump(), owner_user_id=current_user.id, company_id=current_user.company_id)
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


@router.get("/{truck_id}", response_model=TruckRead)
def get_truck(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        truck = db.query(Truck).filter(Truck.id == truck_id, Truck.company_id == current_user.company_id).first()
    else:
        truck = db.query(Truck).filter(Truck.id == truck_id, Truck.owner_user_id == current_user.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    return truck


@router.patch("/{truck_id}", response_model=TruckRead)
def update_truck(
    truck_id: int,
    payload: TruckUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        truck = (
            db.query(Truck)
            .filter(Truck.id == truck_id, Truck.company_id == current_user.company_id)
            .first()
        )
    else:
        truck = (
            db.query(Truck)
            .filter(Truck.id == truck_id, Truck.owner_user_id == current_user.id)
            .first()
        )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(truck, field, value)
    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/{truck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_truck(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        truck = (
            db.query(Truck)
            .filter(Truck.id == truck_id, Truck.company_id == current_user.company_id)
            .first()
        )
    else:
        truck = (
            db.query(Truck)
            .filter(Truck.id == truck_id, Truck.owner_user_id == current_user.id)
            .first()
        )
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    db.delete(truck)
    db.commit()
