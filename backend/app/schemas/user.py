"""
ECOSENSE AI — User Schemas
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_active: bool = True
    is_verified: bool = False


class UserResponse(UserBase):
    id: uuid.UUID
    role: str = "user"
    has_completed_onboarding: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
