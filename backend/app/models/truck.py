from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class TruckStatus(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    maintenance = "maintenance"
    retired = "retired"


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    license_plate = Column(String, unique=True, index=True, nullable=False)
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    capacity_tons = Column(Float, nullable=False)
    status = Column(Enum(TruckStatus), default=TruckStatus.available, nullable=False)
    mileage_km = Column(Float, default=0.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)

    trips = relationship("Trip", back_populates="truck")
    maintenance_services = relationship("MaintenanceService", back_populates="truck")
    ifta_records = relationship("IFTARecord", back_populates="truck")
