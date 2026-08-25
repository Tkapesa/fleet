from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_columns() -> None:
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    required_columns: dict[str, list[str]] = {
        "users": [
            "account_type VARCHAR(20) DEFAULT 'individual'",
            "company_name VARCHAR",
            "company_id INTEGER",
            "role VARCHAR(20) DEFAULT 'user'",
            "google_id VARCHAR",
            "login_code VARCHAR",
            "login_code_expires INTEGER",
        ],
        "drivers": [
            "owner_user_id INTEGER",
            "company_id INTEGER",
            "license_state VARCHAR",
            "license_issue_date DATE",
            "date_of_birth DATE",
            "address VARCHAR",
            "emergency_contact_name VARCHAR",
            "emergency_contact_phone VARCHAR",
            "notes TEXT",
            "assigned_truck_id INTEGER",
            "license_document_url VARCHAR",
            "medical_card_document_url VARCHAR",
            "additional_document_notes TEXT",
        ],
        "trucks": [
            "owner_user_id INTEGER",
            "company_id INTEGER",
            "latitude REAL",
            "longitude REAL",
            "last_telemetry_at DATETIME",
            "last_movement_at DATETIME",
            "height_m REAL",
            "length_m REAL",
        ],
        "trips": [
            "owner_user_id INTEGER",
            "company_id INTEGER",
        ],
        "maintenance_services": [
            "owner_user_id INTEGER",
            "company_id INTEGER",
        ],
        "ifta_records": [
            "owner_user_id INTEGER",
            "company_id INTEGER",
        ],
        "routes": [
            "company_id INTEGER",
            "hazard_level VARCHAR",
            "hazard_summary VARCHAR",
            "hazard_details TEXT",
        ],
        "driver_documents": [
            "company_id INTEGER",
            "expiry_date DATE",
        ],
    }

    with engine.begin() as conn:
        for table_name, column_defs in required_columns.items():
            table_info = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            existing_columns = {row[1] for row in table_info}

            for column_def in column_defs:
                column_name = column_def.split()[0]
                if column_name not in existing_columns:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_def}"))
