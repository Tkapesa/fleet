from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer

from app.database import Base


class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kph = Column(Float, nullable=False, default=0.0)
    heading_degrees = Column(Float, nullable=True)
    odometer_km = Column(Float, nullable=True)
    ignition_on = Column(Boolean, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
