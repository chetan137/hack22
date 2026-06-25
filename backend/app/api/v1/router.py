from fastapi import APIRouter

from app.api.v1 import auth, onboarding, activities, dashboard, carbon, ocr, coach, goals, community

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(carbon.router, prefix="/carbon", tags=["carbon"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
api_router.include_router(coach.router, prefix="/coach", tags=["coach"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
