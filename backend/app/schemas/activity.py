"""
ECOSENSE AI — Activity Schemas
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class ActivityBase(BaseModel):
    category: str
    type: str
    value: float
    unit: str
    date: Optional[datetime] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    category: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    date: Optional[datetime] = None


class ActivityResponse(ActivityBase):
    id: uuid.UUID
    user_id: uuid.UUID
    impact_score: float
    date: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardStatsResponse(BaseModel):
    current_eco_score: int
    total_activities: int
    total_carbon_impact: float
    total_water_saved: float
    total_waste_recycled: float
    recent_activities: list[ActivityResponse]
    trend_data: list[dict] # For the Recharts area chart
