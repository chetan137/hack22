import asyncio
import uuid
import random
import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.user import User
from app.models.activity import Activity
from app.models.eco_profile import EcoProfile

async def generate_synthetic_data():
    async with async_session_factory() as db:
        # Get or create a dummy user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email="testuser_ml@example.com",
                hashed_password="dummy",
                full_name="ML Test User",
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Ensure EcoProfile
        profile_result = await db.execute(select(EcoProfile).where(EcoProfile.user_id == user.id))
        profile = profile_result.scalar_one_or_none()
        if not profile:
            profile = EcoProfile(user_id=user.id, current_eco_score=500.0)
            db.add(profile)
            await db.commit()

        # Generate 1 year of daily data (365 days)
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=365)
        
        activities = []
        
        base_emissions = 10.0 # Random walk base
        base_eco_score = 500.0
        
        for i in range(365):
            current_date = start_date + timedelta(days=i)
            
            # Add some noise and trend
            # Let's say user gradually improves over the year (emissions drop)
            trend = -0.01 * i 
            noise = random.uniform(-2, 2)
            
            # Transportation (carbon)
            trans_val = max(0, 15 + trend + noise)
            activities.append(Activity(
                user_id=user.id,
                category="transportation",
                type="car_trip",
                value=trans_val * 2, # miles
                unit="miles",
                impact_score=-(trans_val), # negative impact
                date=current_date
            ))
            
            # Electricity
            elec_val = max(0, 20 + trend*0.5 + random.uniform(-1, 1))
            activities.append(Activity(
                user_id=user.id,
                category="electricity",
                type="grid_usage",
                value=elec_val * 5, # kWh
                unit="kWh",
                impact_score=-(elec_val),
                date=current_date
            ))
            
            # Update Eco Score (simplistic simulation for training target)
            base_eco_score += random.uniform(0, 2) if trend < 0 else random.uniform(-1, 1)
            
        db.add_all(activities)
        profile.current_eco_score = base_eco_score
        profile.updated_at = now
        await db.commit()
        print(f"Generated 365 days of synthetic data for user {user.id}")

if __name__ == "__main__":
    asyncio.run(generate_synthetic_data())
