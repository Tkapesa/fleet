import json
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertSeverity
from app.core.config import settings


def _make_signature(source: str, truck_id: int | None, title: str, metadata: dict | None) -> str:
    meta = json.dumps(metadata or {}, sort_keys=True)
    return f"{source}|{truck_id or 'none'}|{title}|{meta}"


def create_alert(
    db: Session,
    *,
    owner_user_id: int | None,
    company_id: int | None,
    source: str,
    severity: AlertSeverity,
    title: str,
    message: str,
    truck_id: int | None = None,
    driver_id: int | None = None,
    route_id: int | None = None,
    metadata: dict | None = None,
    dedupe_window_seconds: int | None = None,
) -> Alert:
    # Deduplicate similar alerts within a time window to avoid spamming
    window = dedupe_window_seconds if dedupe_window_seconds is not None else getattr(settings, "ALERT_DEDUPE_SECONDS", None)
    if window and window > 0:
        threshold = datetime.now(timezone.utc) - timedelta(seconds=window)
        existing = (
            db.query(Alert)
            .filter(Alert.source == source, Alert.truck_id == truck_id, Alert.title == title, Alert.created_at >= threshold)
            .order_by(Alert.created_at.desc())
            .first()
        )
        if existing:
            return existing

    alert = Alert(
        owner_user_id=owner_user_id,
        company_id=company_id,
        source=source,
        severity=severity,
        title=title,
        message=message,
        truck_id=truck_id,
        driver_id=driver_id,
        route_id=route_id,
        metadata_json=json.dumps(metadata) if metadata else None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)
    return alert
