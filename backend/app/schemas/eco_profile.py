"""
ECOSENSE AI — EcoProfile Schemas
"""

import uuid
from datetime import datetime

from pydantic import BaseModel


class OnboardingRequest(BaseModel):
    household_size: str
    location: str
    vehicle_type: str
    diet_pattern: str
    electricity_usage: str


class EcoProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    household_size: str
    location: str
    vehicle_type: str
    diet_pattern: str
    electricity_usage: str
    eco_score: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
