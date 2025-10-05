# backend/worker/scheduler.py
import os, psycopg, zoneinfo, logging, asyncio
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from worker.notifier import notify_users_about_incidents, testNot
from .scrape import SOURCES, fetch, section_hash, geocode_address
from .dbio import load_cache, save_cache, upsert_incident
from .parser import parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
TZ = os.getenv("APP_TZ", "Europe/Belgrade")

def get_conn():
    return psycopg.connect(DATABASE_URL)

async def run_scrape_once():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("UPDATE incident SET seen = False")
        conn.commit()
    changed_any = False
    for src in SOURCES:
        cache = load_cache(src.url)
        resp = fetch(src.url, cache.get("etag"), cache.get("last_modified"))
        if resp.status_code == 304:
            logging.info(f"[{src.name}] 304 Not Modified")
            continue
        if resp.status_code != 200:
            logging.warning(f"[{src.name}] HTTP {resp.status_code}")
            continue

        new_etag = resp.headers.get("ETag")
        new_lm   = resp.headers.get("Last-Modified")

        h, text, used = section_hash(resp.text, src.selector)
        import logging
        logging.info(f"[{src.name}] used={used} html_len={len(resp.text)} section_len={len(text)}")
        if not h:
            logging.warning(f"[{src.name}] No date panel found (today). Skipping insert.")
            return

        items = parse(src.name, text)
        inserted, updated = 0, 0
        new_incidents = []

        for it in items:
            address = (it.get("address_text") or "").strip()
            lat, lon = None, None
            if address:
                lat, lon = geocode_address(address)
           
            incident = {
                "title": (it.get("title") or "").strip(),
                "description": (it.get("description") or "").strip(),
                "address_text": address,
                "lat": lat,
                "lon": lon
            }

            is_new = upsert_incident(
                src.name, src.url,
                incident["title"],
                incident["description"],
                incident["address_text"],
                incident["lat"],
                incident["lon"],
            )

            if is_new: 
                new_incidents.append(incident)
                inserted += 1 
            else: 
                updated  += 1
       
        if new_incidents:
            await notify_users_about_incidents(new_incidents)        
        # await testNot()

        changed_any = changed_any or (inserted + updated > 0)
        save_cache(src.url, new_etag, new_lm, h)
        logging.info(f"[{src.name}] inserted={inserted} updated={updated}")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM incident WHERE seen = False")
        conn.commit()
    if changed_any:
        logging.info("Changes detected → (email would be sent here).")

async def main():
    scheduler = AsyncIOScheduler(timezone=zoneinfo.ZoneInfo(TZ))
    # 55th minute, hours 6..23 inclusive (06:55 → 23:55)
    scheduler.add_job(
        run_scrape_once,
        CronTrigger(minute=55, hour="6-23"),
        coalesce=True,              # collapse missed runs into one
        misfire_grace_time=300,     # 5 minutes grace
        id="hourly-scrape",
        replace_existing=True,
    )
    scheduler.start()

    # Optionally run one scrape at startup
    await run_scrape_once()

    logging.info("Scheduler started. Jobs: %s", scheduler.get_jobs())

    # keep the loop alive forever
    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        scheduler.shutdown(wait=False)

if __name__ == "__main__":
    asyncio.run(main())
