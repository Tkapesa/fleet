from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class Geofence(Base):
    __tablename__ = "geofences"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
