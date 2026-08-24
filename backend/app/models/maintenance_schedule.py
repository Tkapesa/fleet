from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False, index=True)
    service_type = Column(String, nullable=False)
    interval_days = Column(Integer, nullable=True)
    interval_km = Column(Float, nullable=True)
    last_service_date = Column(DateTime, nullable=True)
    last_service_km = Column(Float, nullable=True)
    next_due_date = Column(DateTime, nullable=True, index=True)
    next_due_km = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
