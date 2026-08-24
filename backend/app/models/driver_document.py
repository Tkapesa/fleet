from datetime import datetime, date

from sqlalchemy import Column, DateTime, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class DriverDocument(Base):
    __tablename__ = "driver_documents"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    doc_type = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    file_url = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = Column(Date, nullable=True, index=True)

    driver = relationship("Driver", back_populates="documents")
