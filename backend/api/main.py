from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncpg, os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://h2o:h2o@localhost:5432/h2o")

app = FastAPI(title="H2O-Monitor API")

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

@app.get("/incidents")
async def incidents(status: str | None = Query(None, description="active|resolved|planned")):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        if status:
            rows = await conn.fetch(
                "SELECT * "
                "FROM incident WHERE status = $1 ORDER BY created_at DESC LIMIT 500",
                status
            )
        else:
            rows = await conn.fetch(
                "SELECT * "
                "FROM incident ORDER BY created_at DESC LIMIT 500"
            )
        return [dict(r) for r in rows]
    finally:
        await conn.close()
