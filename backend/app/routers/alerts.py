from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.user import User
from app.schemas.alert import AlertRead

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertRead])
def list_alerts(
    severity: AlertSeverity | None = None,
    status: AlertStatus | None = None,
    truck_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        query = db.query(Alert).filter(Alert.company_id == current_user.company_id)
    else:
        query = db.query(Alert).filter(Alert.owner_user_id == current_user.id)

    if severity is not None:
        query = query.filter(Alert.severity == severity)
    if status is not None:
        query = query.filter(Alert.status == status)
    if truck_id is not None:
        query = query.filter(Alert.truck_id == truck_id)

    return query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/{alert_id}/ack", response_model=AlertRead)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        alert = db.query(Alert).filter(Alert.id == alert_id, Alert.company_id == current_user.company_id).first()
    else:
        alert = db.query(Alert).filter(Alert.id == alert_id, Alert.owner_user_id == current_user.id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = AlertStatus.acknowledged
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/summary")
def alert_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.company_id:
        base = db.query(Alert).filter(Alert.company_id == current_user.company_id)
    else:
        base = db.query(Alert).filter(Alert.owner_user_id == current_user.id)

    return {
        "open": base.filter(Alert.status == AlertStatus.open).count(),
        "critical": base.filter(Alert.status == AlertStatus.open, Alert.severity == AlertSeverity.critical).count(),
        "warning": base.filter(Alert.status == AlertStatus.open, Alert.severity == AlertSeverity.warning).count(),
        "info": base.filter(Alert.status == AlertStatus.open, Alert.severity == AlertSeverity.info).count(),
    }
