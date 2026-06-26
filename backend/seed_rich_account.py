import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.user import User
from app.models.activity import Activity
from app.core.security import hash_password
import uuid
import random

async def seed_rich_user():
    async with async_session_factory() as db:
        # Check if user exists
        email = "rich_user@example.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            user = User(
                email=email,
                hashed_password=hash_password("password123"),
                full_name="Rich User",
                role="user"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        # Clear existing activities
        await db.execute(Activity.__table__.delete().where(Activity.user_id == user.id))
        
        # Add 180 days of highly consistent activity
        activities = []
        base_date = datetime.now(timezone.utc) - timedelta(days=180)
        
        for i in range(180):
            current_date = base_date + timedelta(days=i)
            # Transportation
            activities.append(Activity(
                user_id=user.id,
                category="transportation",
                type="car_trip",
                value=10.0,
                unit="miles",
                impact_score=random.uniform(-7.0, -5.0),  # Very consistent negative impact
                date=current_date
            ))
            # Electricity
            activities.append(Activity(
                user_id=user.id,
                category="electricity",
                type="monthly_bill",
                value=100.0,
                unit="kWh",
                impact_score=random.uniform(-12.0, -10.0), # Very consistent negative impact
                date=current_date
            ))
            
        db.add_all(activities)
        await db.commit()
        print(f"Seeded rich user {email} with 360 activities over 180 days.")

if __name__ == "__main__":
    asyncio.run(seed_rich_user())
