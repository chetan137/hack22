"""
ECOSENSE AI — Activity Services & Impact Formulas
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from fastapi import HTTPException

from app.models.activity import Activity
from app.models.eco_profile import EcoProfile
from app.schemas.activity import ActivityCreate, ActivityUpdate, DashboardStatsResponse

# --- Impact Formulas ---
# Now moved to CarbonService and database tables.


from app.services.carbon import CarbonService

# --- CRUD Services ---

async def create_activity(db: AsyncSession, user_id: uuid.UUID, data: ActivityCreate) -> Activity:
    carbon_service = CarbonService(db)
    impact = await carbon_service.calculate_impact(data.category, data.type, data.value, data.unit)
    
    activity_date = data.date if data.date else datetime.now(timezone.utc)
    
    activity = Activity(
        user_id=user_id,
        category=data.category,
        type=data.type,
        value=data.value,
        unit=data.unit,
        impact_score=impact,
        date=activity_date
    )
    
    db.add(activity)
    
    # Update EcoProfile Score dynamically
    stmt = select(EcoProfile).where(EcoProfile.user_id == user_id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if profile:
        profile.eco_score = max(0, min(profile.eco_score + int(impact), 2000))
    
    await db.commit()
    await db.refresh(activity)
    return activity


async def get_user_activities(db: AsyncSession, user_id: uuid.UUID, limit: int = 50) -> Sequence[Activity]:
    stmt = select(Activity).where(Activity.user_id == user_id).order_by(desc(Activity.date)).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def delete_activity(db: AsyncSession, user_id: uuid.UUID, activity_id: uuid.UUID) -> None:
    stmt = select(Activity).where(Activity.id == activity_id, Activity.user_id == user_id)
    activity = (await db.execute(stmt)).scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    # Revert EcoProfile Score
    stmt_prof = select(EcoProfile).where(EcoProfile.user_id == user_id)
    profile = (await db.execute(stmt_prof)).scalar_one_or_none()
    if profile:
        profile.eco_score = max(0, min(profile.eco_score - int(activity.impact_score), 2000))
        
    await db.delete(activity)
    await db.commit()


async def get_dashboard_stats(db: AsyncSession, user_id: uuid.UUID) -> dict:
    # Get Profile
    stmt_prof = select(EcoProfile).where(EcoProfile.user_id == user_id)
    profile = (await db.execute(stmt_prof)).scalar_one_or_none()
    eco_score = profile.eco_score if profile else 1000
    
    # Get recent activities
    recent_activities = await get_user_activities(db, user_id, limit=5)
    
    # Aggregates
    # Total Activities Count
    stmt_count = select(func.count(Activity.id)).where(Activity.user_id == user_id)
    total_activities = (await db.execute(stmt_count)).scalar() or 0
    
    # Transportation impact (negative sum)
    stmt_trans = select(func.sum(Activity.impact_score)).where(Activity.user_id == user_id, Activity.category == "transportation", Activity.impact_score < 0)
    trans_impact = (await db.execute(stmt_trans)).scalar() or 0.0
    
    # Electricity impact
    stmt_elec = select(func.sum(Activity.impact_score)).where(Activity.user_id == user_id, Activity.category == "electricity", Activity.impact_score < 0)
    elec_impact = (await db.execute(stmt_elec)).scalar() or 0.0
    
    total_carbon_impact = abs(trans_impact + elec_impact)
    
    # Water Saved
    stmt_water = select(func.sum(Activity.value)).where(Activity.user_id == user_id, Activity.category == "water", Activity.type == "saved")
    water_saved = (await db.execute(stmt_water)).scalar() or 0.0
    
    # Waste Recycled
    stmt_waste = select(func.sum(Activity.value)).where(Activity.user_id == user_id, Activity.category == "waste", Activity.type == "recycled")
    waste_recycled = (await db.execute(stmt_waste)).scalar() or 0.0
    
    # Trend Data (Last 7 days mock or real)
    # For a real app, we'd group by day. Let's fetch last 7 days of activities and group them in Python for simplicity.
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    stmt_trend = select(Activity).where(Activity.user_id == user_id, Activity.date >= thirty_days_ago).order_by(Activity.date)
    trend_acts = (await db.execute(stmt_trend)).scalars().all()
    
    # Group by day
    trend_dict = {}
    for i in range(30):
        d = (thirty_days_ago + timedelta(days=i)).strftime("%b %d")
        trend_dict[d] = {"name": d, "impact": 0}
        
    for a in trend_acts:
        d_str = a.date.strftime("%b %d")
        if d_str in trend_dict:
            # We plot the absolute impact for the chart
            trend_dict[d_str]["impact"] += abs(a.impact_score)
            
    trend_data = list(trend_dict.values())
    
    return {
        "current_eco_score": eco_score,
        "total_activities": total_activities,
        "total_carbon_impact": total_carbon_impact,
        "total_water_saved": water_saved,
        "total_waste_recycled": waste_recycled,
        "recent_activities": recent_activities,
        "trend_data": trend_data
    }
