"""
ECOSENSE AI — Onboarding API
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.eco_profile import OnboardingRequest, EcoProfileResponse
from app.services.eco_profile import create_eco_profile

router = APIRouter()

@router.post("/", response_model=EcoProfileResponse, status_code=status.HTTP_201_CREATED)
async def submit_onboarding(
    data: OnboardingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit onboarding data, calculate Eco Score, and mark user as onboarded."""
    profile = await create_eco_profile(db, current_user.id, data)
    return profile
