import os, psycopg
from dotenv import load_dotenv
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
def get_conn():
    return psycopg.connect(DATABASE_URL)

def load_cache(url: str):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT etag, last_modified, content_hash FROM source_cache WHERE url=%s", (url,))
        row = cur.fetchone()
        return {"etag": row[0], "last_modified": row[1], "content_hash": row[2]} if row else {"etag": None, "last_modified": None, "content_hash": None}

def save_cache(url: str, etag: str | None, last_modified: str | None, content_hash: str):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO source_cache(url, etag, last_modified, content_hash, updated_at)
            VALUES (%s,%s,%s,%s, now())
            ON CONFLICT (url) DO UPDATE SET etag=EXCLUDED.etag, last_modified=EXCLUDED.last_modified,
                                            content_hash=EXCLUDED.content_hash, updated_at=now()
        """, (url, etag, last_modified, content_hash))
        conn.commit()

def upsert_incident(src: str, src_url: str, title: str, description: str, address_text: str | None, lat: float | None, lon: float | None):
    import hashlib
    key = f"{src}|{title}|{address_text or ''}"
    dh = hashlib.sha1(key.encode("utf-8")).hexdigest()
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
        INSERT INTO incident (
            source, source_url, title, description,
            address_text, dedupe_hash, lat, lon, seen
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (dedupe_hash)
        DO UPDATE SET
            description = EXCLUDED.description,
            updated_at = now(),
            seen = True
        RETURNING (xmax = 0) AS inserted
        """, (src, src_url, title, description, address_text, dh, lat, lon, True))

        inserted = cur.fetchone()[0]
        conn.commit()
        return inserted
