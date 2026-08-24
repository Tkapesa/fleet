import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.database import SessionLocal
from app.main import app
from app.models.driver import Driver
from app.models.truck import Truck
from app.models.user import User


client = TestClient(app)


def _create_user_and_truck(db):
    suffix = uuid.uuid4().hex[:8]
    user = User(
        email=f"phase2+{suffix}@example.com",
        full_name="Phase2 User",
        hashed_password=hash_password("pass"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    truck = Truck(
        owner_user_id=user.id,
        license_plate=f"P2-{suffix.upper()}",
        make="Volvo",
        model="FH",
        year=2022,
        capacity_tons=18.0,
        mileage_km=0,
    )
    db.add(truck)
    db.commit()
    db.refresh(truck)

    return user, truck


def _create_driver(db, owner_user_id: int):
    suffix = uuid.uuid4().hex[:8]
    driver = Driver(
        owner_user_id=owner_user_id,
        full_name="Route Driver",
        email=f"driver+{suffix}@example.com",
        phone="123",
        license_number=f"DRV-{suffix}",
        license_class="A",
        license_expiry=datetime.now(timezone.utc).date() + timedelta(days=365),
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


def test_telemetry_geofence_and_alerts_flow():
    db = SessionLocal()
    try:
        user, truck = _create_user_and_truck(db)
        token = create_access_token(user.id)
        headers = {"Authorization": f"Bearer {token}"}

        geofence_payload = {
            "name": "Depot",
            "truck_id": truck.id,
            "center_latitude": 40.0,
            "center_longitude": -74.0,
            "radius_meters": 300.0,
        }
        geofence_resp = client.post("/geofences/", json=geofence_payload, headers=headers)
        assert geofence_resp.status_code == 201, geofence_resp.text

        heartbeat_payload = {
            "latitude": 40.02,
            "longitude": -74.02,
            "speed_kph": 25,
            "odometer_km": 120.5,
        }
        hb_resp = client.post(f"/telemetry/trucks/{truck.id}/heartbeat", json=heartbeat_payload, headers=headers)
        assert hb_resp.status_code == 201, hb_resp.text

        alerts_resp = client.get("/alerts/", headers=headers)
        assert alerts_resp.status_code == 200, alerts_resp.text
        alerts = alerts_resp.json()
        assert any(a.get("source") == "geofence" for a in alerts)
    finally:
        db.close()


def test_maintenance_schedule_and_route_hazards():
    db = SessionLocal()
    try:
        user, truck = _create_user_and_truck(db)
        driver = _create_driver(db, user.id)
        token = create_access_token(user.id)
        headers = {"Authorization": f"Bearer {token}"}

        schedule_payload = {
            "truck_id": truck.id,
            "service_type": "engine_oil",
            "interval_km": 100,
            "last_service_km": 0,
        }
        create_schedule = client.post("/maintenance-schedules/", json=schedule_payload, headers=headers)
        assert create_schedule.status_code == 201, create_schedule.text

        hb_resp = client.post(
            f"/telemetry/trucks/{truck.id}/heartbeat",
            json={"latitude": 40.0, "longitude": -74.0, "speed_kph": 0, "odometer_km": 150},
            headers=headers,
        )
        assert hb_resp.status_code == 201, hb_resp.text

        due_resp = client.post("/maintenance-schedules/check-due", headers=headers)
        assert due_resp.status_code == 200, due_resp.text
        assert due_resp.json().get("due_alerts_created", 0) >= 1

        route_payload = {
            "reference": f"R-{uuid.uuid4().hex[:6]}",
            "origin": "Mountain yard",
            "destination": "Storm valley",
            "truck_id": truck.id,
            "driver_id": driver.id,
            "scheduled_departure": datetime.now(timezone.utc).isoformat(),
        }
        route_resp = client.post("/routes/", json=route_payload, headers=headers)
        assert route_resp.status_code == 201, route_resp.text
        route_data = route_resp.json()
        assert route_data.get("hazard_level") == "high"
    finally:
        db.close()
