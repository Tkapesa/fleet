from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.truck import Truck, TruckStatus
from app.models.user import User
from app.schemas.trip import TripCreate, TripRead, TripUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=list[TripRead])
def list_trips(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Trip)
        .filter(Trip.owner_user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
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
    if truck.status != TruckStatus.available:
        raise HTTPException(status_code=409, detail="Truck is not available")

    driver = (
        db.query(Driver)
        .filter(Driver.id == payload.driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    trip = Trip(**payload.model_dump(), owner_user_id=current_user.id)
    truck.status = TruckStatus.on_trip
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.owner_user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.patch("/{trip_id}", response_model=TripRead)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.owner_user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    update_data = payload.model_dump(exclude_unset=True)

    # When a trip is completed or cancelled, free up the truck
    new_status = update_data.get("status")
    if new_status in ("completed", "cancelled"):
        truck = db.get(Truck, trip.truck_id)
        if truck:
            truck.status = TruckStatus.available

    for field, value in update_data.items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = (
        db.query(Trip)
        .filter(Trip.id == trip_id, Trip.owner_user_id == current_user.id)
        .first()
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
