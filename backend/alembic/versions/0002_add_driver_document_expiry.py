"""add driver_documents.expiry_date

Revision ID: 0002_add_driver_document_expiry
Revises: 0001_add_companies_and_company_id
Create Date: 2026-08-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_driver_document_expiry'
down_revision = '0001_add_companies_and_company_id'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("driver_documents")}
    if "expiry_date" not in columns:
        with op.batch_alter_table("driver_documents") as batch_op:
            batch_op.add_column(sa.Column("expiry_date", sa.Date(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("driver_documents")}
    if "expiry_date" in columns:
        with op.batch_alter_table("driver_documents") as batch_op:
            batch_op.drop_column("expiry_date")
