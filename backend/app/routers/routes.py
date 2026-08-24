from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.driver import Driver
from app.models.route import FleetRoute
from app.models.truck import Truck
from app.models.user import User
from app.schemas.route import RouteCreate, RouteRead, RouteUpdate
from app.services.route_hazards import assess_route_hazards

router = APIRouter(prefix="/routes", tags=["routes"])


def get_owned_route(route_id: int, db: Session, current_user: User) -> FleetRoute:
    if current_user.company_id:
        route = db.query(FleetRoute).filter(FleetRoute.id == route_id, FleetRoute.company_id == current_user.company_id).first()
    else:
        route = db.query(FleetRoute).filter(FleetRoute.id == route_id, FleetRoute.owner_user_id == current_user.id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


def validate_assignments(truck_id: int, driver_id: int, db: Session, current_user: User) -> None:
    if current_user.company_id:
        truck = db.query(Truck).filter(Truck.id == truck_id, Truck.company_id == current_user.company_id).first()
    else:
        truck = db.query(Truck).filter(Truck.id == truck_id, Truck.owner_user_id == current_user.id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    if current_user.company_id:
        driver = db.query(Driver).filter(Driver.id == driver_id, Driver.company_id == current_user.company_id).first()
    else:
        driver = db.query(Driver).filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")


@router.get("/", response_model=list[RouteRead])
def list_routes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        base_q = db.query(FleetRoute).filter(FleetRoute.company_id == current_user.company_id)
    else:
        base_q = db.query(FleetRoute).filter(FleetRoute.owner_user_id == current_user.id)
    return base_q.order_by(FleetRoute.scheduled_departure.asc()).offset(skip).limit(limit).all()


@router.post("/", response_model=RouteRead, status_code=status.HTTP_201_CREATED)
def create_route(
    payload: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_assignments(payload.truck_id, payload.driver_id, db, current_user)
    hazard = assess_route_hazards(payload.origin, payload.destination)
    route = FleetRoute(
        **{k:v for k,v in payload.model_dump().items() if k != 'geometry'},
        owner_user_id=current_user.id,
        company_id=current_user.company_id,
        hazard_level=hazard.risk_level,
        hazard_summary=hazard.summary,
        hazard_details="; ".join(hazard.hazards) if hazard.hazards else None,
        geometry_json=(None if payload.geometry is None else __import__('json').dumps(payload.geometry)),
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


@router.get("/{route_id}", response_model=RouteRead)
def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_route(route_id, db, current_user)


@router.patch("/{route_id}", response_model=RouteRead)
def update_route(
    route_id: int,
    payload: RouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    route = get_owned_route(route_id, db, current_user)
    update_data = payload.model_dump(exclude_unset=True)
    truck_id = update_data.get("truck_id", route.truck_id)
    driver_id = update_data.get("driver_id", route.driver_id)
    validate_assignments(truck_id, driver_id, db, current_user)

    for field, value in update_data.items():
        setattr(route, field, value)

    hazard = assess_route_hazards(route.origin, route.destination)
    route.hazard_level = hazard.risk_level
    route.hazard_summary = hazard.summary
    route.hazard_details = "; ".join(hazard.hazards) if hazard.hazards else None
    if hasattr(payload, "geometry") and payload.model_dump().get("geometry") is not None:
        route.geometry_json = __import__("json").dumps(payload.model_dump().get("geometry"))

    db.commit()
    db.refresh(route)
    return route


@router.get("/{route_id}/hazards")
def get_route_hazards(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    route = get_owned_route(route_id, db, current_user)
    hazard = assess_route_hazards(route.origin, route.destination)
    return {
        "route_id": route.id,
        "risk_level": hazard.risk_level,
        "summary": hazard.summary,
        "hazards": hazard.hazards,
    }


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    route = get_owned_route(route_id, db, current_user)
    db.delete(route)
    db.commit()
