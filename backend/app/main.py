from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, ensure_sqlite_columns
from app.routers import auth, trucks, drivers, trips, maintenance, ifta

# Import models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

app = FastAPI(
    title="Truck Fleet Management API",
    version="1.0.0",
    description="API for managing trucks, drivers, and trips",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_columns()


app.include_router(auth.router)
app.include_router(trucks.router)
app.include_router(drivers.router)
app.include_router(trips.router)
app.include_router(maintenance.router)
app.include_router(ifta.router)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "Truck Fleet API is running"}
