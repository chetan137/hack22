"""
ECOSENSE AI — EcoProfile Model
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EcoProfile(Base):
    __tablename__ = "eco_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    
    # Onboarding Data
    household_size: Mapped[str] = mapped_column(String(50), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(100), nullable=False)
    diet_pattern: Mapped[str] = mapped_column(String(100), nullable=False)
    electricity_usage: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Calculated Score
    eco_score: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    # Relationships
    # Note: User -> EcoProfile relationship should be added to user.py if bidirectional traversal is needed.

    def __repr__(self) -> str:
        return f"<EcoProfile user_id={self.user_id} score={self.eco_score}>"
