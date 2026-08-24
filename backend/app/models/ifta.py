from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class IFTARecord(Base):
    __tablename__ = "ifta_records"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    jurisdiction = Column(String, nullable=False, index=True)
    miles_driven = Column(Float, nullable=False)
    gallons_purchased = Column(Float, nullable=False)
    tax_rate_per_gallon = Column(Float, nullable=False)
    fleet_mpg = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    truck = relationship("Truck", back_populates="ifta_records")