from datetime import date

from sqlalchemy import Column, Integer, String, Boolean, Date, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class LicenseClass(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_class = Column(Enum(LicenseClass), nullable=False)
    license_state = Column(String, nullable=True)
    license_issue_date = Column(Date, nullable=True)
    license_expiry = Column(Date, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    assigned_truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True, index=True)
    license_document_url = Column(String, nullable=True)
    medical_card_document_url = Column(String, nullable=True)
    additional_document_notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    trips = relationship("Trip", back_populates="driver")
    assigned_truck = relationship("Truck", back_populates="assigned_drivers", foreign_keys=[assigned_truck_id])
    documents = relationship("DriverDocument", back_populates="driver", cascade="all, delete-orphan")

    @property
    def license_days_until_expiry(self) -> int | None:
        if not self.license_expiry:
            return None
        return (self.license_expiry - date.today()).days

    @property
    def license_status(self) -> str:
        days = self.license_days_until_expiry
        if days is None:
            return "unknown"
        if days < 0:
            return "expired"
        if days <= 30:
            return "expiring_soon"
        return "valid"

    @property
    def assigned_truck_label(self) -> str | None:
        if not self.assigned_truck:
            return None
        return self.assigned_truck.license_plate
