from app.database import engine
from sqlalchemy import text


def inspect_db():
    with engine.connect() as conn:
        print("-- alembic_version --")
        try:
            row = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
            print("alembic version:", row[0] if row else "<none>")
        except Exception as e:
            print("alembic_version table not found or error:", e)

        def show_table_info(tbl):
            print(f"-- PRAGMA table_info({tbl}) --")
            try:
                rows = conn.execute(text(f"PRAGMA table_info({tbl})")).fetchall()
                for r in rows:
                    print(r)
            except Exception as e:
                print(f"Table {tbl} missing or error: {e}")

        for tbl in ["companies", "users", "trucks", "drivers", "trips"]:
            show_table_info(tbl)


if __name__ == "__main__":
    inspect_db()
