"""
ECOSENSE AI — SQLAlchemy Models

Re-export all models so Alembic can discover them via a single import.
"""

from app.core.database import Base
from app.models.activity import Activity
from app.models.chat import ChatMessage
from app.models.eco_profile import EcoProfile
from app.models.emission_factor import EmissionFactor
from app.models.goal import Goal
from app.models.user import RefreshToken, User
from app.models.community_event import CommunityEvent, EventParticipant
from app.models.gamification import GamificationProfile, Badge, UserBadge

__all__ = [
    "Base",
    "User",
    "RefreshToken",
    "EcoProfile",
    "Activity",
    "EmissionFactor",
    "Goal",
    "ChatMessage",
    "CommunityEvent",
    "EventParticipant",
    "GamificationProfile",
    "Badge",
    "UserBadge",
]
