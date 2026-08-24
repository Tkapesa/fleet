import logging
from datetime import date, timedelta

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.driver_document import DriverDocument
import app.notifications as notifications

logger = logging.getLogger("expiry_checker")

ALERT_DAYS = 30


def run_check() -> dict:
    now = date.today()
    threshold = now + timedelta(days=ALERT_DAYS)
    db = SessionLocal()
    try:
        expiring_drivers = db.query(Driver).filter(Driver.license_expiry <= threshold).all()
        expiring_docs = db.query(DriverDocument).filter(DriverDocument.expiry_date != None, DriverDocument.expiry_date <= threshold).all()

        result = {
            "drivers": [
                {"id": d.id, "full_name": d.full_name, "license_expiry": str(d.license_expiry)} for d in expiring_drivers
            ],
            "documents": [
                {"id": doc.id, "driver_id": doc.driver_id, "doc_type": doc.doc_type, "expiry_date": str(doc.expiry_date)} for doc in expiring_docs
            ],
        }

        if result["drivers"] or result["documents"]:
            logger.info("Expiry check found %d drivers and %d documents nearing expiry", len(result["drivers"]), len(result["documents"]))
            # send webhook notification (best-effort)
            try:
                notifications.notify_webhook({"type": "expiry_alert", "threshold": str(threshold), **result})
            except Exception:
                logger.exception("Notifier failed")

        return result
    finally:
        db.close()


async def start_expiry_checker():
    import asyncio

    while True:
        try:
            run_check()
        except Exception:
            logger.exception("Error during expiry check")
        await asyncio.sleep(24 * 60 * 60)
