import uuid
from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal, GoalStatus
from app.models.eco_profile import EcoProfile
from app.schemas.goal import GoalCreate, GoalUpdate


async def get_user_goals(db: AsyncSession, user_id: uuid.UUID) -> Sequence[Goal]:
    """Retrieve all goals for a specific user, ordered by creation date."""
    stmt = select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_goal_by_id(db: AsyncSession, goal_id: uuid.UUID, user_id: uuid.UUID) -> Goal:
    """Retrieve a specific goal for a user."""
    stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found"
        )
    return goal


async def create_goal(db: AsyncSession, user_id: uuid.UUID, goal_in: GoalCreate) -> Goal:
    """Create a new goal for a user."""
    goal = Goal(
        user_id=user_id,
        title=goal_in.title,
        description=goal_in.description,
        target_date=goal_in.target_date,
        eco_score_reward=goal_in.eco_score_reward,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


async def update_goal(db: AsyncSession, user_id: uuid.UUID, goal_id: uuid.UUID, goal_update: GoalUpdate) -> Goal:
    """Update an existing goal. If marked as completed, boost the user's eco score."""
    goal = await get_goal_by_id(db, goal_id, user_id)
    
    # Check if transitioning to COMPLETED status for the first time
    awarding_points = False
    if goal_update.status == GoalStatus.COMPLETED and goal.status != GoalStatus.COMPLETED:
        awarding_points = True
        
    # Update fields
    update_data = goal_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
        
    # If completed, add points to the EcoProfile
    if awarding_points:
        stmt_profile = select(EcoProfile).where(EcoProfile.user_id == user_id)
        profile_result = await db.execute(stmt_profile)
        profile = profile_result.scalar_one_or_none()
        
        if profile:
            profile.eco_score += goal.eco_score_reward
            db.add(profile)

    await db.commit()
    await db.refresh(goal)
    return goal


async def delete_goal(db: AsyncSession, user_id: uuid.UUID, goal_id: uuid.UUID) -> None:
    """Delete a user's goal."""
    goal = await get_goal_by_id(db, goal_id, user_id)
    await db.delete(goal)
    await db.commit()
