"""
ECOSENSE AI — Main FastAPI Application
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


from app.core.database import async_session_factory, engine, Base
from app.services.carbon import seed_emission_factors
import app.models  # Ensures all models are registered with Base

from sqlalchemy import select
from app.models.user import User
from app.models.community_event import CommunityEvent
import bcrypt
from datetime import datetime, timedelta

async def seed_demo_admin(db):
    result = await db.execute(select(User).where(User.email == "demo_admin@ecosense.ai"))
    if not result.scalar_one_or_none():
        hashed = bcrypt.hashpw("Admin@123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        demo_admin = User(
            email="demo_admin@ecosense.ai",
            hashed_password=hashed,
            full_name="Demo Admin",
            role="super_admin",
            is_active=True,
        )
        db.add(demo_admin)
        await db.commit()

async def seed_community_events(db):
    result = await db.execute(select(CommunityEvent).limit(1))
    if not result.scalars().first():
        event1 = CommunityEvent(
            title="Versova Beach Cleanup",
            type="cleanup",
            latitude=19.1351,
            longitude=72.8146,
            date=datetime.utcnow() + timedelta(days=2),
            description="Join us for a massive beach cleanup drive this weekend.",
            points_reward=500
        )
        event2 = CommunityEvent(
            title="Sanjay Gandhi Park Tree Plantation",
            type="plantation",
            latitude=19.2140,
            longitude=72.9106,
            date=datetime.utcnow() + timedelta(days=5),
            description="Planting 1000 saplings to restore the green cover.",
            points_reward=300
        )
        db.add_all([event1, event2])
        await db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist (fixes 500 crashes on Render for new models)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default emission factors, demo admin, and community events
    async with async_session_factory() as db:
        await seed_emission_factors(db)
        await seed_demo_admin(db)
        await seed_community_events(db)
    yield
    # Shutdown logic


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
import os
_cors_origins = list(set(settings.cors_origins_list + [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://hack22-seven.vercel.app",
    os.getenv("FRONTEND_URL", ""),
]))
_cors_origins = [origin for origin in _cors_origins if origin]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Mount uploads directory for serving OCR bill images
from pathlib import Path
from fastapi.staticfiles import StaticFiles
uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

from fastapi import Request
from fastapi.responses import JSONResponse
import logging

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
        headers=headers,
    )
