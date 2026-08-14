from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path

from app.database import engine, Base, ensure_sqlite_columns, SessionLocal
from app.core.security import hash_password
from app.models.user import AccountType, User
from app.routers import auth, trucks, drivers, trips, maintenance, ifta

# Import models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

app = FastAPI(
    title="Truck Fleet Management API",
    version="1.0.0",
    description="API for managing trucks, drivers, and trips",
)

UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_demo_user(db: Session) -> None:
    demo_email = "demo@truckappdemo.com"
    existing = db.query(User).filter(User.email == demo_email).first()
    if existing:
        return

    demo_user = User(
        email=demo_email,
        full_name="Demo Driver",
        hashed_password=hash_password("Demo123!"),
        account_type=AccountType.individual,
        company_name=None,
        is_active=True,
        is_admin=False,
    )
    db.add(demo_user)
    db.commit()


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()
    db = SessionLocal()
    try:
        ensure_demo_user(db)
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(trucks.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(ifta.router)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "Truck Fleet API is running"}
