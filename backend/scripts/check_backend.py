import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.database import engine, Base, ensure_sqlite_columns, SessionLocal
import app.models  # register models
from app.models.user import User


def run_checks():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()

    print("Opening DB session to verify demo user exists or create one...")
    db = SessionLocal()
    try:
        users = db.query(User).limit(5).all()
        print(f"Found {len(users)} user(s) in DB (showing up to 5):")
        for u in users:
            print(f" - id={u.id} email={u.email} company_id={getattr(u, 'company_id', None)} role={getattr(u, 'role', None)}")
    finally:
        db.close()


if __name__ == "__main__":
    run_checks()
