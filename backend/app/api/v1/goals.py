import uuid
from typing import Sequence
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.schemas.goal import GoalResponse, GoalCreate, GoalUpdate
from app.services import goal as goal_service

router = APIRouter()


@router.get("/", response_model=list[GoalResponse])
async def get_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Sequence[GoalResponse]:
    """Get all goals for the current user."""
    return await goal_service.get_user_goals(db, current_user.id)


@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> GoalResponse:
    """Create a new goal."""
    return await goal_service.create_goal(db, current_user.id, goal_in)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    goal_update: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> GoalResponse:
    """Update a goal. Marking as completed will boost eco score."""
    return await goal_service.update_goal(db, current_user.id, goal_id, goal_update)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """Delete a goal."""
    await goal_service.delete_goal(db, current_user.id, goal_id)
