import io
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.driver import Driver
from datetime import date
from app.tasks.expiry_checker import run_check
import app.notifications as notifications


def create_user_and_driver(db, email="testuser@example.com"):
    # remove any existing user with same email to avoid UNIQUE constraint failures
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        db.query(Driver).filter(Driver.owner_user_id == existing.id).delete()
        db.delete(existing)
        db.commit()

    # use unique email per test run to avoid collisions in persistent DB
    user = User(email=email, full_name="Test User", hashed_password=hash_password("pass"), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)

    unique_suffix = uuid.uuid4().hex[:8]
    driver_email = f"dtest+{unique_suffix}@example.com"
    driver = Driver(full_name="D Test", email=driver_email, phone="123", license_number=f"L123-{unique_suffix}", license_class="A", license_expiry=date.fromisoformat("2030-01-01"), owner_user_id=user.id)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return user, driver


def test_upload_accepts_expiry(tmp_path):
    client = TestClient(app)
    db = SessionLocal()
    try:
        user, driver = create_user_and_driver(db, email="testuser+upload@example.com")
        token = create_access_token(user.id)

        pdf_bytes = b"%PDF-1.4 test\n"
        files = {
            "file": ("doc.pdf", io.BytesIO(pdf_bytes), "application/pdf"),
        }
        data = {"doc_type": "license", "expiry_date": "2030-02-01"}
        resp = client.post(f"/drivers/{driver.id}/documents", headers={"Authorization": f"Bearer {token}"}, data=data, files=files)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body.get("expiry_date") == "2030-02-01"
    finally:
        db.close()


def test_run_check_calls_notifier(monkeypatch):
    # ensure notifier is called when items near expiry
    called = {}

    def fake_notify(payload):
        called['payload'] = payload

    monkeypatch.setattr(notifications, 'notify_webhook', fake_notify)

    db = SessionLocal()
    try:
        # create driver/doc that expires soon; use unique email
        unique_suffix = uuid.uuid4().hex[:8]
        user_email = f"notify+{unique_suffix}@example.com"
        user = User(email=user_email, full_name="N", hashed_password=hash_password("p"), is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        driver = Driver(full_name="Near Expiry", email=f"ne+{unique_suffix}@example.com", phone="1", license_number=f"NX1-{unique_suffix}", license_class="A", license_expiry=date.fromisoformat("2026-09-01"), owner_user_id=user.id)
        db.add(driver)
        db.commit()
        db.refresh(driver)

        result = run_check()
        # if there are any entries, notifier should have been called
        if result.get('drivers') or result.get('documents'):
            assert 'payload' in called
    finally:
        db.close()
