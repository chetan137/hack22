from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.eco_profile import EcoProfile
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/community", tags=["community"])


class LeaderboardEntry(BaseModel):
    id: str
    full_name: str
    eco_score: int
    level: int
    rank: int


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the top 10 users by eco score."""
    stmt = (
        select(User, EcoProfile)
        .join(EcoProfile, User.id == EcoProfile.user_id)
        .where(User.is_active == True)
        .order_by(desc(EcoProfile.eco_score))
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    leaderboard = []
    for index, (user, profile) in enumerate(rows):
        leaderboard.append(
            LeaderboardEntry(
                id=str(user.id),
                full_name=user.full_name,
                eco_score=profile.eco_score,
                level=profile.level,
                rank=index + 1
            )
        )
        
    # TODO: Add logic to always include the current user if they are outside top 10
    
    return leaderboard
