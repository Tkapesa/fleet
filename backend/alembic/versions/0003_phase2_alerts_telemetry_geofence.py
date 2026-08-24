"""phase 2 alerts, telemetry, geofence, maintenance schedules

Revision ID: 0003_phase2_alerts_telemetry_geofence
Revises: 0002_add_driver_document_expiry
Create Date: 2026-08-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0003_phase2_alerts_telemetry_geofence"
down_revision = "0002_add_driver_document_expiry"
branch_labels = None
depends_on = None


def _has_table(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    cols = {c["name"] for c in inspector.get_columns(table_name)}
    return column_name in cols


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "trucks", "last_telemetry_at"):
        with op.batch_alter_table("trucks") as batch_op:
            batch_op.add_column(sa.Column("last_telemetry_at", sa.DateTime(), nullable=True))

    inspector = sa.inspect(bind)
    if not _has_column(inspector, "trucks", "last_movement_at"):
        with op.batch_alter_table("trucks") as batch_op:
            batch_op.add_column(sa.Column("last_movement_at", sa.DateTime(), nullable=True))

    inspector = sa.inspect(bind)
    if not _has_column(inspector, "routes", "hazard_level"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.add_column(sa.Column("hazard_level", sa.String(), nullable=True))

    inspector = sa.inspect(bind)
    if not _has_column(inspector, "routes", "hazard_summary"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.add_column(sa.Column("hazard_summary", sa.String(), nullable=True))

    inspector = sa.inspect(bind)
    if not _has_column(inspector, "routes", "hazard_details"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.add_column(sa.Column("hazard_details", sa.Text(), nullable=True))

    inspector = sa.inspect(bind)
    if not _has_table(inspector, "alerts"):
        op.create_table(
            "alerts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("owner_user_id", sa.Integer(), nullable=True),
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("truck_id", sa.Integer(), nullable=True),
            sa.Column("driver_id", sa.Integer(), nullable=True),
            sa.Column("route_id", sa.Integer(), nullable=True),
            sa.Column("source", sa.String(), nullable=False),
            sa.Column("severity", sa.String(length=20), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("metadata_json", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("acknowledged_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_alerts_owner_user_id", "alerts", ["owner_user_id"])
        op.create_index("ix_alerts_company_id", "alerts", ["company_id"])
        op.create_index("ix_alerts_truck_id", "alerts", ["truck_id"])
        op.create_index("ix_alerts_driver_id", "alerts", ["driver_id"])
        op.create_index("ix_alerts_route_id", "alerts", ["route_id"])
        op.create_index("ix_alerts_source", "alerts", ["source"])

    inspector = sa.inspect(bind)
    if not _has_table(inspector, "maintenance_schedules"):
        op.create_table(
            "maintenance_schedules",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("owner_user_id", sa.Integer(), nullable=True),
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("truck_id", sa.Integer(), nullable=False),
            sa.Column("service_type", sa.String(), nullable=False),
            sa.Column("interval_days", sa.Integer(), nullable=True),
            sa.Column("interval_km", sa.Float(), nullable=True),
            sa.Column("last_service_date", sa.DateTime(), nullable=True),
            sa.Column("last_service_km", sa.Float(), nullable=True),
            sa.Column("next_due_date", sa.DateTime(), nullable=True),
            sa.Column("next_due_km", sa.Float(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_maintenance_schedules_owner_user_id", "maintenance_schedules", ["owner_user_id"])
        op.create_index("ix_maintenance_schedules_company_id", "maintenance_schedules", ["company_id"])
        op.create_index("ix_maintenance_schedules_truck_id", "maintenance_schedules", ["truck_id"])
        op.create_index("ix_maintenance_schedules_next_due_date", "maintenance_schedules", ["next_due_date"])

    inspector = sa.inspect(bind)
    if not _has_table(inspector, "geofences"):
        op.create_table(
            "geofences",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("owner_user_id", sa.Integer(), nullable=True),
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("truck_id", sa.Integer(), nullable=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("center_latitude", sa.Float(), nullable=False),
            sa.Column("center_longitude", sa.Float(), nullable=False),
            sa.Column("radius_meters", sa.Float(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_geofences_owner_user_id", "geofences", ["owner_user_id"])
        op.create_index("ix_geofences_company_id", "geofences", ["company_id"])
        op.create_index("ix_geofences_truck_id", "geofences", ["truck_id"])

    inspector = sa.inspect(bind)
    if not _has_table(inspector, "telemetry_events"):
        op.create_table(
            "telemetry_events",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("owner_user_id", sa.Integer(), nullable=True),
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("truck_id", sa.Integer(), nullable=False),
            sa.Column("latitude", sa.Float(), nullable=False),
            sa.Column("longitude", sa.Float(), nullable=False),
            sa.Column("speed_kph", sa.Float(), nullable=False),
            sa.Column("heading_degrees", sa.Float(), nullable=True),
            sa.Column("odometer_km", sa.Float(), nullable=True),
            sa.Column("ignition_on", sa.Boolean(), nullable=True),
            sa.Column("recorded_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_telemetry_events_owner_user_id", "telemetry_events", ["owner_user_id"])
        op.create_index("ix_telemetry_events_company_id", "telemetry_events", ["company_id"])
        op.create_index("ix_telemetry_events_truck_id", "telemetry_events", ["truck_id"])
        op.create_index("ix_telemetry_events_recorded_at", "telemetry_events", ["recorded_at"])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_table(inspector, "telemetry_events"):
        op.drop_table("telemetry_events")

    inspector = sa.inspect(bind)
    if _has_table(inspector, "geofences"):
        op.drop_table("geofences")

    inspector = sa.inspect(bind)
    if _has_table(inspector, "maintenance_schedules"):
        op.drop_table("maintenance_schedules")

    inspector = sa.inspect(bind)
    if _has_table(inspector, "alerts"):
        op.drop_table("alerts")

    inspector = sa.inspect(bind)
    if _has_column(inspector, "routes", "hazard_details"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.drop_column("hazard_details")

    inspector = sa.inspect(bind)
    if _has_column(inspector, "routes", "hazard_summary"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.drop_column("hazard_summary")

    inspector = sa.inspect(bind)
    if _has_column(inspector, "routes", "hazard_level"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.drop_column("hazard_level")

    inspector = sa.inspect(bind)
    if _has_column(inspector, "trucks", "last_movement_at"):
        with op.batch_alter_table("trucks") as batch_op:
            batch_op.drop_column("last_movement_at")

    inspector = sa.inspect(bind)
    if _has_column(inspector, "trucks", "last_telemetry_at"):
        with op.batch_alter_table("trucks") as batch_op:
            batch_op.drop_column("last_telemetry_at")
