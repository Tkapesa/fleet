import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from app.main import app


def run():
    client = TestClient(app)
    suffix = uuid4().hex[:8]
    email = f"ci-company-{suffix}@example.com"
    company_name = f"CI Company Ltd {suffix}"
    license_plate = f"CI-{suffix[:6].upper()}"

    print("Registering company user...")
    resp = client.post(
        "/auth/register",
        json={
            "email": email,
            "full_name": "CI Company Owner",
            "password": "Test12345!",
            "account_type": "company",
            "company_name": company_name,
        },
    )
    print("register status", resp.status_code, resp.text)
    if resp.status_code not in (200, 201):
        return

    print("Logging in...")
    resp = client.post("/auth/login", json={"email": email, "password": "Test12345!"})
    print("login status", resp.status_code, resp.text)
    if resp.status_code != 200:
        return
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    print("Creating a truck...")
    truck_payload = {
        "license_plate": license_plate,
        "make": "TestMake",
        "model": "T1",
        "year": 2020,
        "capacity_tons": 10.5,
    }
    resp = client.post("/trucks/", json=truck_payload, headers=headers)
    print("create truck status", resp.status_code, resp.text)
    if resp.status_code not in (200, 201):
        return

    print("Listing trucks...")
    resp = client.get("/trucks/", headers=headers)
    print("list trucks status", resp.status_code, resp.text)


if __name__ == "__main__":
    run()
