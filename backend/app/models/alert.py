from datetime import datetime, timezone
import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text

from app.database import Base


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertStatus(str, enum.Enum):
    open = "open"
    acknowledged = "acknowledged"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True, index=True)
    source = Column(String, nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), nullable=False, default=AlertSeverity.warning)
    status = Column(Enum(AlertStatus), nullable=False, default=AlertStatus.open)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
