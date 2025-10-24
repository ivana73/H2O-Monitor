from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncpg, os, bcrypt
from dotenv import load_dotenv
import re
from pydantic import BaseModel, EmailStr

# 1) load .env so DATABASE_URL is available
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://h2o:h2o@localhost:5432/h2o")

app = FastAPI(title="H2O-Monitor API")

# tiny log so you can confirm target DB at startup (password masked)
def _mask_url(url: str) -> str:
    return re.sub(r'//([^:]+):[^@]+@', r'//\1:***@', url)

print(f"[api] Using DATABASE_URL → {_mask_url(DATABASE_URL)}")

class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    city: str
    areas: list[str] = []
    addressOfUser: list[str] = []

class UpdateSubscribe(BaseModel):
    email: EmailStr
    areas: list[str] = []
    addressOfUser: list[str] = []

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class reportedIncidentPayload(BaseModel):
    email: EmailStr
    reportedDescription: str
    reportedAddress: str

# CORS for your Vite frontend at 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/login")
async def login(payload: LoginPayload):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check if email exists
        row = await conn.fetchrow("SELECT * FROM \"user\" WHERE email = $1", payload.email)
        if not row:
            raise HTTPException(status_code=400, detail="Email is wrong.")
        # Hash password check
        password_matches = bcrypt.checkpw(payload.password.encode(), row["password_hash"].encode())
        if not password_matches:
            raise HTTPException(status_code=400, detail="Password is wrong.")
        return {"user": {
            "id": row["id"],
            "email": row["email"],
            "city": row["city"],
            "areas": row["areas"],
            "addressOfUser": row["addressofuser"]
            }}
    finally:
        await conn.close()

@app.post("/update-user-preferences")
async def updatePreferences(payload: UpdateSubscribe):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Update DB
        await conn.execute("""
            UPDATE "user"
            SET areas = $1, addressOfUser = $2
            WHERE email = $3
        """, payload.areas, payload.addressOfUser, payload.email)
        return {"ok": True}
    finally:
        await conn.close()

@app.post("/register")
async def register(payload: RegisterPayload):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check if email already exists
        existing = await conn.fetchval("SELECT 1 FROM \"user\" WHERE email = $1", payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        password_hash = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt()).decode()

        # Insert into DB
        await conn.execute("""
            INSERT INTO "user" (email, password_hash, city, areas, addressOfUser)
            VALUES ($1, $2, $3, $4, $5)
        """, payload.email, password_hash, payload.city, payload.areas, payload.addressOfUser)

        return {"ok": True, "message": "User registered"}
    finally:
        await conn.close()

@app.get("/__debug/schema")
async def debug_schema():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'incident' AND table_schema = 'public'
            ORDER BY column_name
        """)
        return {"columns": [r["column_name"] for r in rows]}
    finally:
        await conn.close()

@app.post("/report_incident")
async def report_incident(payload: reportedIncidentPayload):
    conn = await asyncpg.connect(DATABASE_URL)
    print(payload)
    try:
        await conn.execute("""
            INSERT INTO reportedIncident (email, reportedDescription, reportedAddress)
            VALUES ($1, $2, $3)
        """, payload.email, payload.reportedDescription, payload.reportedAddress)

        return {"ok": True}
    finally:
        await conn.close()

@app.get("/incidents")
async def incidents(status: str | None = Query(None, description="active|resolved|planned")):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        if status:
            rows = await conn.fetch(
                """
                SELECT *
                FROM incident
                WHERE status = $1
                ORDER BY created_at DESC
                LIMIT 500
                """,
                status
            )
        else:
            rows = await conn.fetch(
                """
                SELECT *
                FROM incident
                ORDER BY created_at DESC
                LIMIT 500
                """
            )
        # dict(r) will include lat/lon if the table has those columns
        return [dict(r) for r in rows]
    finally:
        await conn.close()