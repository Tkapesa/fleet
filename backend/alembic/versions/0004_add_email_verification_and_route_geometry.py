"""add email verification fields and route geometry

Revision ID: 0004_add_email_verification_and_route_geometry
Revises: 0003_phase2_alerts_telemetry_geofence
Create Date: 2026-08-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_add_email_verification_and_route_geometry"
down_revision = "0003_phase2_alerts_telemetry_geofence"
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

    if _has_table(inspector, "users") and not _has_column(inspector, "users", "email_verified"):
        with op.batch_alter_table("users") as batch_op:
            batch_op.add_column(sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text('0')))

    inspector = sa.inspect(bind)
    if _has_table(inspector, "users") and not _has_column(inspector, "users", "email_verification_token"):
        with op.batch_alter_table("users") as batch_op:
            batch_op.add_column(sa.Column("email_verification_token", sa.String(), nullable=True))

    inspector = sa.inspect(bind)
    if _has_table(inspector, "routes") and not _has_column(inspector, "routes", "geometry_json"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.add_column(sa.Column("geometry_json", sa.Text(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_table(inspector, "routes") and _has_column(inspector, "routes", "geometry_json"):
        with op.batch_alter_table("routes") as batch_op:
            batch_op.drop_column("geometry_json")

    inspector = sa.inspect(bind)
    if _has_table(inspector, "users") and _has_column(inspector, "users", "email_verification_token"):
        with op.batch_alter_table("users") as batch_op:
            batch_op.drop_column("email_verification_token")

    inspector = sa.inspect(bind)
    if _has_table(inspector, "users") and _has_column(inspector, "users", "email_verified"):
        with op.batch_alter_table("users") as batch_op:
            batch_op.drop_column("email_verified")
