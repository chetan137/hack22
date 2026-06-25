"""
ECOSENSE AI — Activity Model
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Float, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    
    category: Mapped[str] = mapped_column(String(50), nullable=False) # 'transportation', 'electricity', 'water', 'waste'
    type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. 'car_trip', 'flight', 'monthly_bill'
    value: Mapped[float] = mapped_column(Float, nullable=False) # User input value
    unit: Mapped[str] = mapped_column(String(20), nullable=False) # 'miles', 'kWh', 'gallons', 'lbs'
    
    impact_score: Mapped[float] = mapped_column(Float, nullable=False) # Calculated score (e.g., negative for emissions, positive for recycling)
    
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    def __repr__(self) -> str:
        return f"<Activity {self.category} value={self.value} impact={self.impact_score}>"
