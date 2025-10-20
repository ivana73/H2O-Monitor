# backend/worker/scheduler.py
import os, zoneinfo, logging, asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from .scrape import SOURCES, fetch, section_hash
from .dbio import load_cache, save_cache, upsert_incident
from .parser import parse

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
TZ = os.getenv("APP_TZ", "Europe/Belgrade")

async def run_scrape_once():
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
        for it in items:
            is_new = upsert_incident(
                src.name, src.url,
                (it.get("title") or "").strip(),
                (it.get("description") or "").strip(),
                it.get("address_text"),
            )
            if is_new: inserted += 1
            else:      updated  += 1

        changed_any = changed_any or (inserted + updated > 0)
        save_cache(src.url, new_etag, new_lm, h)
        logging.info(f"[{src.name}] inserted={inserted} updated={updated}")

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

    # Optionally run one scrape at startup (comment out if you don't want it)
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
