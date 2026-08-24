from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class MaintenanceService(Base):
    __tablename__ = "maintenance_services"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False, index=True)
    service_date = Column(DateTime, nullable=False)
    service_type = Column(String, nullable=False)
    vendor = Column(String, nullable=True)
    mileage_km = Column(Float, nullable=True)
    cost = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    truck = relationship("Truck", back_populates="maintenance_services")