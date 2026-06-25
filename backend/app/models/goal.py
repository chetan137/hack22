import uuid
from sqlalchemy import String, ForeignKey, Date, Enum, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.core.database import Base

from datetime import datetime, timezone, date

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"

class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    
    status: Mapped[GoalStatus] = mapped_column(Enum(GoalStatus, name="goalstatus_enum"), default=GoalStatus.ACTIVE, nullable=False)
    
    target_date: Mapped[date] = mapped_column(Date, nullable=True)
    eco_score_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="goals")
