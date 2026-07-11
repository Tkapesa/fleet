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
        ],
        "drivers": [
            "owner_user_id INTEGER",
        ],
        "trucks": [
            "owner_user_id INTEGER",
        ],
        "trips": [
            "owner_user_id INTEGER",
        ],
        "maintenance_services": [
            "owner_user_id INTEGER",
        ],
        "ifta_records": [
            "owner_user_id INTEGER",
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
