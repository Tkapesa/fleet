"""add companies and company_id columns

Revision ID: 0001_add_companies_and_company_id
Revises: 
Create Date: 2026-08-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_companies_and_company_id'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # create companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('owner_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    # add columns
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('role', sa.String(length=20), nullable=True))

    tables = ['trucks', 'drivers', 'trips', 'maintenance_services', 'ifta_records', 'routes', 'driver_documents']
    for t in tables:
        try:
            op.add_column(t, sa.Column('company_id', sa.Integer(), nullable=True))
        except Exception:
            # table may not exist yet in some environments
            pass

    # Data migration: create companies for company-type users and re-link resources
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, company_name FROM users WHERE account_type = 'company' AND (company_id IS NULL) ")).fetchall()
    for user_id, company_name in rows:
        name = company_name or f"company-{user_id}"
        # insert company
        try:
            conn.execute(sa.text("INSERT INTO companies (name, owner_user_id) VALUES (:name, :owner)"), {'name': name, 'owner': user_id})
        except Exception:
            # ignore insert errors (unique conflicts)
            pass
        comp_id = conn.execute(sa.text("SELECT id FROM companies WHERE owner_user_id = :owner"), {'owner': user_id}).fetchone()[0]

        conn.execute(sa.text("UPDATE users SET company_id = :cid, role = 'owner' WHERE id = :uid"), {'cid': comp_id, 'uid': user_id})

        for t in tables:
            try:
                conn.execute(sa.text(f"UPDATE {t} SET company_id = :cid WHERE owner_user_id = :uid AND (company_id IS NULL)"), {'cid': comp_id, 'uid': user_id})
            except Exception:
                pass


def downgrade():
    # remove added columns and drop companies table
    tables = ['trucks', 'drivers', 'trips', 'maintenance_services', 'ifta_records', 'routes', 'driver_documents']
    for t in tables:
        try:
            op.drop_column(t, 'company_id')
        except Exception:
            pass

    with op.batch_alter_table('users') as batch_op:
        try:
            batch_op.drop_column('company_id')
        except Exception:
            pass
        try:
            batch_op.drop_column('role')
        except Exception:
            pass

    op.drop_table('companies')
