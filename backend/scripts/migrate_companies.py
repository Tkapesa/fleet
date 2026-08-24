from sqlalchemy import text
from app.database import engine


def column_exists(conn, table, column):
    dialect = conn.engine.dialect.name
    if dialect == "sqlite":
        res = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        return any(r[1] == column for r in res)
    else:
        res = conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = :table AND column_name = :col"
            ),
            {"table": table, "col": column},
        ).fetchone()
        return res is not None


def ensure_companies_table(conn):
    # Create companies table if not exists
    dialect = conn.engine.dialect.name
    if dialect == "sqlite":
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR NOT NULL UNIQUE,
                    owner_user_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
    else:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS companies (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL UNIQUE,
                    owner_user_id INTEGER,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
                )
                """
            )
        )


def ensure_column(conn, table, column, col_def="INTEGER"):
    if not column_exists(conn, table, column):
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"))


def migrate():
    with engine.begin() as conn:
        print("Ensuring companies table exists...")
        ensure_companies_table(conn)

        print("Ensuring company_id/role columns exist where needed...")
        # users
        ensure_column(conn, "users", "company_id", "INTEGER")
        ensure_column(conn, "users", "role", "VARCHAR(20) DEFAULT 'user'")
        # resources
        tables = [
            "trucks",
            "drivers",
            "trips",
            "maintenance_services",
            "ifta_records",
            "routes",
            "driver_documents",
        ]
        for t in tables:
            ensure_column(conn, t, "company_id", "INTEGER")

        print("Finding company-type users without company records...")
        rows = conn.execute(
            text("SELECT id, company_name FROM users WHERE account_type = 'company' AND (company_id IS NULL)")
        ).fetchall()
        print(f"Found {len(rows)} company users to migrate")

        for user_id, company_name in rows:
            name = company_name or f"company-{user_id}"
            print(f"Creating company for user {user_id}: {name}")
            # Insert company
            if conn.engine.dialect.name == "sqlite":
                conn.execute(
                    text("INSERT OR IGNORE INTO companies (name, owner_user_id) VALUES (:name, :owner)"),
                    {"name": name, "owner": user_id},
                )
                comp_id = conn.execute(text("SELECT id FROM companies WHERE owner_user_id = :owner"), {"owner": user_id}).fetchone()[0]
            else:
                res = conn.execute(
                    text("INSERT INTO companies (name, owner_user_id) VALUES (:name, :owner) RETURNING id"),
                    {"name": name, "owner": user_id},
                )
                comp_id = res.fetchone()[0]

            # update user
            conn.execute(
                text("UPDATE users SET company_id = :cid, role = 'owner' WHERE id = :uid"), {"cid": comp_id, "uid": user_id}
            )

            # Update resources owned by this user to reference company
            for t in ["trucks", "drivers", "trips", "maintenance_services", "ifta_records", "routes", "driver_documents"]:
                cnt = conn.execute(
                    text(f"UPDATE {t} SET company_id = :cid WHERE owner_user_id = :uid AND (company_id IS NULL)"), {"cid": comp_id, "uid": user_id}
                )
                # cnt is a CursorResult; rows affected may be available as rowcount
                print(f"  Updated {getattr(cnt, 'rowcount', 'N/A')} rows in {t}")

        print("Migration complete.")


if __name__ == "__main__":
    migrate()
