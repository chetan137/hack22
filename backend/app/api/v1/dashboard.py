"""
ECOSENSE AI — Dashboard API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.activity import DashboardStatsResponse
from app.services.activity import get_dashboard_stats

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
async def read_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_dashboard_stats(db, current_user.id)
