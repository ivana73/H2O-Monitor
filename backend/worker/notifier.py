from typing import List, Dict
import asyncio
import asyncpg

from dotenv import load_dotenv
import os
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://h2o:h2o@localhost:5432/h2o")

# Dummy async email function — zameni stvarnom
async def send_email_to(email: str, incident: Dict):
    print(f"[EMAIL] → {email} obavešten o: {incident['address_text']}")

def should_notify_user(user: Dict, incident: Dict) -> bool:
    incident_area = incident["address_text"].split(",")[0].strip().lower()
    incident_full = incident["address_text"].strip().lower()

    areas = set((user.get("areas") or []))
    addresses = set((user.get("addressofuser") or []))

    return (incident_area.lower() in (a.lower() for a in areas)) or \
           (incident_full.lower() in (a.lower() for a in addresses))

async def notify_users_about_incident(incident: Dict):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        users = await conn.fetch("SELECT email, areas, addressOfUser FROM \"user\"")
        already_notified = set()

        for user in users:
            email = user["email"]
            if not email or email in already_notified:
                continue

            user_data = {
                "email": email,
                "areas": user["areas"],
                "addressofuser": user["addressofuser"]
            }

            if should_notify_user(user_data, incident):
                await send_email_to(email, incident)
                already_notified.add(email)

    finally:
        await conn.close()
