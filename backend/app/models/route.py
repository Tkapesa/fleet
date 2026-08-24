from datetime import datetime, timezone
import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
import json


class RouteStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_transit = "in_transit"
    delayed = "delayed"
    completed = "completed"
    cancelled = "cancelled"


class FleetRoute(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    reference = Column(String, nullable=False, index=True)
    status = Column(Enum(RouteStatus), default=RouteStatus.scheduled, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_description = Column(Text, nullable=True)
    scheduled_departure = Column(DateTime, nullable=False)
    estimated_arrival = Column(DateTime, nullable=True)
    distance_miles = Column(Integer, nullable=True)
    hazard_level = Column(String, nullable=True)
    hazard_summary = Column(String, nullable=True)
    hazard_details = Column(Text, nullable=True)
    geometry_json = Column(Text, nullable=True)

    @property
    def geometry(self):
        if self.geometry_json:
            try:
                return json.loads(self.geometry_json)
            except Exception:
                return None
        return None
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    truck = relationship("Truck")
    driver = relationship("Driver")
