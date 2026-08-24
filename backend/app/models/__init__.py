from app.models.user import User
from app.models.company import Company
from app.models.truck import Truck
from app.models.driver import Driver
from app.models.driver_document import DriverDocument
from app.models.trip import Trip
from app.models.route import FleetRoute
from app.models.maintenance import MaintenanceService
from app.models.ifta import IFTARecord
from app.models.alert import Alert
from app.models.geofence import Geofence
from app.models.maintenance_schedule import MaintenanceSchedule
from app.models.telemetry_event import TelemetryEvent

__all__ = [
	"User",
	"Company",
	"Truck",
	"Driver",
	"DriverDocument",
	"Trip",
	"FleetRoute",
	"MaintenanceService",
	"IFTARecord",
	"Alert",
	"Geofence",
	"MaintenanceSchedule",
	"TelemetryEvent",
]
