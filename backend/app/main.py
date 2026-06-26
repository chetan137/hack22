"""
ECOSENSE AI — Main FastAPI Application
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


from app.core.database import async_session_factory
from app.services.carbon import seed_emission_factors

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default emission factors
    async with async_session_factory() as db:
        await seed_emission_factors(db)
    yield
    # Shutdown logic


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
_cors_origins = list(set(settings.cors_origins_list + [
    "http://localhost:5173",
    "http://localhost:5174",
]))
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
