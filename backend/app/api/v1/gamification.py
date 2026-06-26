from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.gamification import GamificationProfile, Badge, UserBadge
from app.api.deps import get_current_active_user

router = APIRouter()


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon_name: str
    points_required: int
    earned: bool


class GamificationProfileResponse(BaseModel):
    current_streak: int
    highest_streak: int
    total_eco_points: int
    current_level: str
    badges: List[BadgeResponse]


@router.get("/profile", response_model=GamificationProfileResponse)
async def get_gamification_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the user's gamification profile and badges."""
    
    # Get or create profile
    stmt = select(GamificationProfile).where(GamificationProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = GamificationProfile(user_id=current_user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    # Get all badges and check which ones user has
    stmt_badges = select(Badge).order_by(Badge.points_required)
    result_badges = await db.execute(stmt_badges)
    all_badges = result_badges.scalars().all()
    
    stmt_user_badges = select(UserBadge.badge_id).where(UserBadge.user_id == current_user.id)
    result_user_badges = await db.execute(stmt_user_badges)
    earned_badge_ids = set(result_user_badges.scalars().all())

    badge_responses = []
    for badge in all_badges:
        badge_responses.append(
            BadgeResponse(
                id=str(badge.id),
                name=badge.name,
                description=badge.description,
                icon_name=badge.icon_name,
                points_required=badge.points_required,
                earned=badge.id in earned_badge_ids
            )
        )

    return GamificationProfileResponse(
        current_streak=profile.current_streak,
        highest_streak=profile.highest_streak,
        total_eco_points=profile.total_eco_points,
        current_level=profile.current_level,
        badges=badge_responses
    )


class CheckAchievementsResponse(BaseModel):
    points_awarded: int
    new_total_points: int
    new_level: Optional[str]
    new_badges: List[BadgeResponse]


@router.post("/check-achievements", response_model=CheckAchievementsResponse)
async def check_achievements(
    points_earned: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Triggered to award points and check for level ups or badges."""
    stmt = select(GamificationProfile).where(GamificationProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = GamificationProfile(user_id=current_user.id)
        db.add(profile)

    profile.total_eco_points += points_earned
    
    new_level = None
    levels = [
        (0, "Eco Rookie"),
        (500, "Green Explorer"),
        (1500, "Climate Guardian"),
        (3000, "Planet Protector")
    ]
    
    # Determine level
    target_level = "Eco Rookie"
    for threshold, name in levels:
        if profile.total_eco_points >= threshold:
            target_level = name
            
    if target_level != profile.current_level:
        profile.current_level = target_level
        new_level = target_level

    # Check for new badges
    stmt_badges = select(Badge).where(Badge.points_required <= profile.total_eco_points)
    result_badges = await db.execute(stmt_badges)
    eligible_badges = result_badges.scalars().all()
    
    stmt_user_badges = select(UserBadge.badge_id).where(UserBadge.user_id == current_user.id)
    result_user_badges = await db.execute(stmt_user_badges)
    earned_badge_ids = set(result_user_badges.scalars().all())

    new_badges = []
    for badge in eligible_badges:
        if badge.id not in earned_badge_ids:
            # Award badge
            user_badge = UserBadge(user_id=current_user.id, badge_id=badge.id)
            db.add(user_badge)
            new_badges.append(
                BadgeResponse(
                    id=str(badge.id),
                    name=badge.name,
                    description=badge.description,
                    icon_name=badge.icon_name,
                    points_required=badge.points_required,
                    earned=True
                )
            )

    await db.commit()
    
    return CheckAchievementsResponse(
        points_awarded=points_earned,
        new_total_points=profile.total_eco_points,
        new_level=new_level,
        new_badges=new_badges
    )
