from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.goal import GoalStatus


class GoalBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the goal")
    description: Optional[str] = Field(None, max_length=1000, description="Detailed description")
    target_date: Optional[date] = Field(None, description="Optional target date to complete the goal")
    eco_score_reward: int = Field(50, description="Eco score points rewarded upon completion")


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[GoalStatus] = None
    target_date: Optional[date] = None


class GoalResponse(GoalBase):
    id: UUID
    user_id: UUID
    status: GoalStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
