# backend/migrations/run_migrations.py
import psycopg
import glob, os

DB_DSN = os.getenv(
    "DB_DSN",
    f"postgresql://{os.getenv('DB_USER','h2o')}:{os.getenv('DB_PASSWORD','h2o')}@{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','5432')}/{os.getenv('DB_NAME','h2o')}"
)

def run_migrations():
    sql_files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "../api/db/schema/*.sql")))
    with psycopg.connect(DB_DSN) as conn, conn.cursor() as cur:
        for f in sql_files:
            print(f"→ running {f}")
            with open(f, "r") as fh:
                cur.execute(fh.read())
        conn.commit()

if __name__ == "__main__":
    run_migrations()
