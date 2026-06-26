from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.gamification import GamificationProfile
from app.models.community_event import CommunityEvent, EventParticipant
from app.api.deps import get_current_active_user

router = APIRouter()


class LeaderboardEntry(BaseModel):
    id: str
    full_name: str
    eco_score: int
    level: str
    rank: int


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the top 10 users by eco score based on GamificationProfile."""
    stmt = (
        select(User, GamificationProfile)
        .join(GamificationProfile, User.id == GamificationProfile.user_id)
        .where(User.is_active == True)
        .order_by(desc(GamificationProfile.total_eco_points))
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
                eco_score=profile.total_eco_points,
                level=profile.current_level,
                rank=index + 1
            )
        )
        
    return leaderboard


class EventResponse(BaseModel):
    id: str
    title: str
    type: str
    latitude: float
    longitude: float
    date: datetime
    description: str
    points_reward: int
    participants_count: int
    joined: bool


@router.get("/events", response_model=List[EventResponse])
async def get_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(CommunityEvent).order_by(CommunityEvent.date)
    result = await db.execute(stmt)
    events = result.scalars().all()

    # Get participant counts and check if current user joined
    response = []
    for event in events:
        stmt_parts = select(EventParticipant).where(EventParticipant.event_id == event.id)
        result_parts = await db.execute(stmt_parts)
        parts = result_parts.scalars().all()
        
        joined = any(p.user_id == current_user.id for p in parts)
        
        response.append(
            EventResponse(
                id=str(event.id),
                title=event.title,
                type=event.type,
                latitude=event.latitude,
                longitude=event.longitude,
                date=event.date,
                description=event.description,
                points_reward=event.points_reward,
                participants_count=len(parts),
                joined=joined
            )
        )
    return response


@router.post("/events/{event_id}/join")
async def join_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Check if already joined
    stmt = select(EventParticipant).where(
        EventParticipant.event_id == event_id,
        EventParticipant.user_id == current_user.id
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if not existing:
        participant = EventParticipant(event_id=event_id, user_id=current_user.id)
        db.add(participant)
        await db.commit()
    
    return {"status": "success"}
