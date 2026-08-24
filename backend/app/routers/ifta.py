from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.ifta import IFTARecord
from app.models.truck import Truck
from app.models.user import User
from app.schemas.ifta import IFTACalculation, IFTARecordCreate, IFTARecordRead, IFTARecordUpdate

router = APIRouter(prefix="/ifta", tags=["ifta"])


def _calculate_ifta_values(record: IFTARecord) -> IFTACalculation:
    effective_mpg = record.fleet_mpg if record.fleet_mpg and record.fleet_mpg > 0 else None
    if effective_mpg is None:
        effective_mpg = (record.miles_driven / record.gallons_purchased) if record.gallons_purchased > 0 else 0.0

    if effective_mpg <= 0:
        taxable_gallons = 0.0
    else:
        taxable_gallons = max((record.miles_driven / effective_mpg) - record.gallons_purchased, 0.0)

    tax_due = taxable_gallons * record.tax_rate_per_gallon
    return IFTACalculation(
        taxable_gallons=round(taxable_gallons, 2),
        tax_due=round(tax_due, 2),
        effective_mpg=round(effective_mpg, 2),
    )


def _serialize_record(record: IFTARecord) -> IFTARecordRead:
    return IFTARecordRead(
        id=record.id,
        truck_id=record.truck_id,
        period_start=record.period_start,
        period_end=record.period_end,
        jurisdiction=record.jurisdiction,
        miles_driven=record.miles_driven,
        gallons_purchased=record.gallons_purchased,
        tax_rate_per_gallon=record.tax_rate_per_gallon,
        fleet_mpg=record.fleet_mpg,
        created_at=record.created_at,
        calculations=_calculate_ifta_values(record),
    )


@router.get("/", response_model=list[IFTARecordRead])
def list_ifta_records(
    truck_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        query = db.query(IFTARecord).filter(IFTARecord.company_id == current_user.company_id)
    else:
        query = db.query(IFTARecord).filter(IFTARecord.owner_user_id == current_user.id)
    if truck_id is not None:
        query = query.filter(IFTARecord.truck_id == truck_id)

    records = query.order_by(IFTARecord.period_start.desc()).offset(skip).limit(limit).all()
    return [_serialize_record(record) for record in records]


@router.post("/", response_model=IFTARecordRead, status_code=status.HTTP_201_CREATED)
def create_ifta_record(
    payload: IFTARecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.period_end < payload.period_start:
        raise HTTPException(status_code=400, detail="period_end must be on or after period_start")

    if current_user.company_id:
        truck = db.query(Truck).filter(Truck.id == payload.truck_id, Truck.company_id == current_user.company_id).first()
    else:
        truck = db.query(Truck).filter(Truck.id == payload.truck_id, Truck.owner_user_id == current_user.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")

    record = IFTARecord(**payload.model_dump(), owner_user_id=current_user.id, company_id=current_user.company_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize_record(record)


@router.get("/{record_id}", response_model=IFTARecordRead)
def get_ifta_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        record = db.query(IFTARecord).filter(IFTARecord.id == record_id, IFTARecord.company_id == current_user.company_id).first()
    else:
        record = db.query(IFTARecord).filter(IFTARecord.id == record_id, IFTARecord.owner_user_id == current_user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="IFTA record not found")
    return _serialize_record(record)


@router.patch("/{record_id}", response_model=IFTARecordRead)
def update_ifta_record(
    record_id: int,
    payload: IFTARecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(IFTARecord)
        .filter(IFTARecord.id == record_id, IFTARecord.owner_user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="IFTA record not found")

    update_data = payload.model_dump(exclude_unset=True)
    next_period_start = update_data.get("period_start", record.period_start)
    next_period_end = update_data.get("period_end", record.period_end)
    if next_period_end < next_period_start:
        raise HTTPException(status_code=400, detail="period_end must be on or after period_start")

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return _serialize_record(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ifta_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(IFTARecord)
        .filter(IFTARecord.id == record_id, IFTARecord.owner_user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="IFTA record not found")

    db.delete(record)
    db.commit()