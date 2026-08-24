import math

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.alert import AlertSeverity
from app.models.geofence import Geofence
from app.models.truck import Truck
from app.models.user import User
from app.schemas.geofence import GeofenceCreate, GeofenceRead, GeofenceUpdate
from app.services.alerts import create_alert

router = APIRouter(prefix="/geofences", tags=["geofences"])


EARTH_RADIUS_METERS = 6371000.0


def _distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_METERS * c


def _scoped_truck_query(db: Session, current_user: User):
    if current_user.company_id:
        return db.query(Truck).filter(Truck.company_id == current_user.company_id)
    return db.query(Truck).filter(Truck.owner_user_id == current_user.id)


@router.get("/", response_model=list[GeofenceRead])
def list_geofences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        return db.query(Geofence).filter(Geofence.company_id == current_user.company_id).order_by(Geofence.created_at.desc()).all()
    return db.query(Geofence).filter(Geofence.owner_user_id == current_user.id).order_by(Geofence.created_at.desc()).all()


@router.post("/", response_model=GeofenceRead, status_code=status.HTTP_201_CREATED)
def create_geofence(
    payload: GeofenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.truck_id is not None:
        truck = _scoped_truck_query(db, current_user).filter(Truck.id == payload.truck_id).first()
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")

    geofence = Geofence(
        owner_user_id=current_user.id,
        company_id=current_user.company_id,
        **payload.model_dump(),
    )
    db.add(geofence)
    db.commit()
    db.refresh(geofence)
    return geofence


@router.patch("/{geofence_id}", response_model=GeofenceRead)
def update_geofence(
    geofence_id: int,
    payload: GeofenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        geofence = db.query(Geofence).filter(Geofence.id == geofence_id, Geofence.company_id == current_user.company_id).first()
    else:
        geofence = db.query(Geofence).filter(Geofence.id == geofence_id, Geofence.owner_user_id == current_user.id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "truck_id" in update_data and update_data["truck_id"] is not None:
        truck = _scoped_truck_query(db, current_user).filter(Truck.id == update_data["truck_id"]).first()
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")

    for field, value in update_data.items():
        setattr(geofence, field, value)

    db.commit()
    db.refresh(geofence)
    return geofence


@router.post("/evaluate")
def evaluate_geofences(
    truck_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    truck = _scoped_truck_query(db, current_user).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    if truck.latitude is None or truck.longitude is None:
        raise HTTPException(status_code=400, detail="Truck has no location telemetry")

    if current_user.company_id:
        geofences = db.query(Geofence).filter(Geofence.company_id == current_user.company_id, Geofence.is_active == True).all()
    else:
        geofences = db.query(Geofence).filter(Geofence.owner_user_id == current_user.id, Geofence.is_active == True).all()

    breaches = []
    for geofence in geofences:
        if geofence.truck_id is not None and geofence.truck_id != truck.id:
            continue
        dist = _distance_meters(truck.latitude, truck.longitude, geofence.center_latitude, geofence.center_longitude)
        if dist > geofence.radius_meters:
            breaches.append({"geofence_id": geofence.id, "distance_meters": round(dist, 2), "radius_meters": geofence.radius_meters})
            create_alert(
                db,
                owner_user_id=current_user.id,
                company_id=current_user.company_id,
                source="geofence",
                severity=AlertSeverity.critical,
                title="Geofence breach",
                message=f"Truck {truck.license_plate} is outside geofence '{geofence.name}'.",
                truck_id=truck.id,
                metadata={"geofence_id": geofence.id, "distance_meters": dist},
            )

    db.commit()
    return {"truck_id": truck_id, "breaches": breaches}
