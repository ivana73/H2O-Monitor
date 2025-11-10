import asyncio
from locale import normalize
import os
import asyncpg
from dotenv import load_dotenv
from typing import Dict, List
from email.message import EmailMessage
import aiosmtplib
from geopy.distance import geodesic
from unidecode import unidecode
import cyrtranslit
from typing import Dict, Tuple, Optional
from geopy.distance import geodesic
import re
from pathlib import Path

from worker.scrape import geocode_address

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# asyncio.run(testNot())

async def send_email_to(email: str, incidents: list[dict]):
    msg = EmailMessage()
    msg["From"] = EMAIL_SENDER
    msg["To"] = email
    msg["Subject"] = "Nestanak vode u tvojoj prijavljenoj oblasti"
    body = "Prijavljeni su novi kvarovi:\n\n"
    for inc in incidents:
        body += f"""Lokacija: { cyrtranslit.to_latin(inc.get('address_text', 'Nepoznata lokacija'))}
Opis: {cyrtranslit.to_latin(inc.get('description', 'nema opisa'))}
        """

    body += "\nH2O Monitor tim"
    msg.set_content(body)

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=EMAIL_SENDER,
        password=EMAIL_PASSWORD,
    )

async def testNot():
    print("Running testNot")

def incident_matches_user(user: Dict, incident: Dict, threshold_km: float = 0.7) -> bool:
    address = incident.get("address_text")

    address_norm = normalize(address)
    area = address_norm.split(",")[0]

    latinArea = cyrtranslit.to_latin(area)

    user_areas = [normalize(a) for a in (user.get("areas") or [])]
    user_addrs = [normalize(a) for a in (user.get("addressofuser") or [])]

    if latinArea in user_areas or address_norm in user_addrs:
        return True
    
    if incident.get("lat") and incident.get("lon"):

        for addr_text in user.get("addressofuser", []):
            if not addr_text:
                continue

            addr_text = str(addr_text).strip().strip("{}\"' ")
            addr_text = addr_text.replace("\n", " ").strip()
            
            cyrilic_addr = cyrtranslit.to_cyrillic(addr_text)   

            lat_user = lon_user = None
            lat, lon = geocode_address(cyrilic_addr)
            if lat is not None and lon is not None:
                lat_user, lon_user = lat, lon
                

            # print(lat_user, lon_user)
            # print(float(incident["lat"]), float(incident["lon"]))
            dist = geodesic(
                (float(incident["lat"]), float(incident["lon"])),
                (lat_user, lon_user)
            ).km
            if dist <= threshold_km:
                return True
    return False


async def notify_users_about_incidents(incidents: List[Dict]):
    if not incidents:
        return

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        users = await conn.fetch("SELECT email, areas, addressOfUser FROM \"user\"")
        users_to_notify = {}

        for user in users:
            user_obj = {
                "email": user["email"],
                "areas": user["areas"],
                "addressofuser": user["addressofuser"]
            }

            matched = []
            for inc in incidents:
                if incident_matches_user(user_obj, inc):
                    matched.append(inc)

            if matched:
                users_to_notify[user["email"]] = matched
        for email, matched_incidents in users_to_notify.items():
            await send_email_to(email, matched_incidents)

    finally:
        await conn.close()

async def notify_newUser_about_incidents(email: str, incidents: List[Dict]):
    if not incidents:
        return

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        user = await conn.fetchrow("SELECT areas, addressOfUser FROM \"user\" where email = email")

        user_obj = {
            "email": email,
            "areas": user["areas"],
            "addressofuser": user["addressofuser"]
        }
        matched = []
        for inc in incidents:
            if incident_matches_user(user_obj, inc):
                matched.append(inc)

        if matched:
            await send_email_to(email, matched)

    finally:
        await conn.close()
