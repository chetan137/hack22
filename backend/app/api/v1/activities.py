"""
ECOSENSE AI — Activities API
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse
from app.services.activity import create_activity, get_user_activities, delete_activity

router = APIRouter()

@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_new_activity(
    data: ActivityCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_activity(db, current_user.id, data)

@router.get("/", response_model=list[ActivityResponse])
async def read_activities(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_user_activities(db, current_user.id, limit)

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_activity(
    activity_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_activity(db, current_user.id, activity_id)
