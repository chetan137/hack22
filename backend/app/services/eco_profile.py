"""
ECOSENSE AI — Eco Score Logic
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import uuid

from app.models.user import User
from app.models.eco_profile import EcoProfile
from app.schemas.eco_profile import OnboardingRequest

def calculate_eco_score(data: OnboardingRequest) -> int:
    score = 1000

    # Household adjustments
    if data.household_size == "1":
        score -= 50
    elif data.household_size in ["3", "4", "5+"]:
        score += 20 * int(data.household_size[0])

    # Diet pattern
    if data.diet_pattern == "Vegan":
        score += 200
    elif data.diet_pattern == "Vegetarian":
        score += 100
    elif data.diet_pattern == "Omnivore":
        score -= 100
    elif data.diet_pattern == "Heavy Meat":
        score -= 200

    # Vehicle
    if data.vehicle_type == "EV":
        score += 150
    elif data.vehicle_type == "Hybrid":
        score += 50
    elif data.vehicle_type == "Gas (Efficient)":
        score -= 50
    elif data.vehicle_type == "Gas (Heavy/SUV)":
        score -= 150
    elif data.vehicle_type == "No Vehicle (Public Transit/Bike)":
        score += 250

    # Electricity
    if data.electricity_usage == "Low":
        score += 50
    elif data.electricity_usage == "High":
        score -= 100
    if "Renewable" in data.electricity_usage:
        score += 150
        
    # Location
    # North America grid relies more on fossil fuels than Europe generally
    if data.location == "North America":
        score -= 50
    elif data.location == "Europe":
        score += 50

    return max(0, min(score, 2000)) # Cap between 0 and 2000


async def create_eco_profile(
    db: AsyncSession, user_id: uuid.UUID, data: OnboardingRequest
) -> EcoProfile:
    # Ensure user exists
    stmt_user = select(User).where(User.id == user_id)
    user = (await db.execute(stmt_user)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    score = calculate_eco_score(data)

    # Check if profile already exists (upsert: update instead of reject)
    stmt_profile = select(EcoProfile).where(EcoProfile.user_id == user_id)
    existing_profile = (await db.execute(stmt_profile)).scalar_one_or_none()

    if existing_profile:
        # Update all fields on re-submission
        existing_profile.household_size = data.household_size
        existing_profile.location = data.location
        existing_profile.vehicle_type = data.vehicle_type
        existing_profile.diet_pattern = data.diet_pattern
        existing_profile.electricity_usage = data.electricity_usage
        existing_profile.eco_score = score
        user.has_completed_onboarding = True
        await db.commit()
        await db.refresh(existing_profile)
        return existing_profile

    # Create new profile
    profile = EcoProfile(
        user_id=user_id,
        household_size=data.household_size,
        location=data.location,
        vehicle_type=data.vehicle_type,
        diet_pattern=data.diet_pattern,
        electricity_usage=data.electricity_usage,
        eco_score=score
    )

    user.has_completed_onboarding = True

    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return profile

