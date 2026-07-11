from sqlalchemy import Column, Integer, String, Boolean, Date, Enum, ForeignKey
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
    license_expiry = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    trips = relationship("Trip", back_populates="driver")
