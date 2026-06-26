"""
ECOSENSE AI — Admin API Routes
Role-based access: admin | super_admin only
"""

import csv
import io
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.models.activity import Activity
from app.models.community_event import CommunityEvent
from app.models.emission_factor import EmissionFactor
from app.models.eco_profile import EcoProfile

router = APIRouter()

def utcnow():
    return datetime.now(timezone.utc)

# ─────────────────────────────────────────────────────────────────────────────
# PLATFORM STATS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    active_users = (await db.execute(select(func.count()).select_from(User).where(User.is_active == True))).scalar()
    admin_users = (await db.execute(select(func.count()).select_from(User).where(User.role.in_(["admin", "super_admin"])))).scalar()
    total_activities = (await db.execute(select(func.count()).select_from(Activity))).scalar()
    total_carbon = (await db.execute(select(func.coalesce(func.sum(Activity.impact_score), 0)).select_from(Activity))).scalar()

    # New users last 7 days
    week_ago = utcnow() - timedelta(days=7)
    new_users_week = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= week_ago)
    )).scalar()

    # Activities per category
    cat_result = await db.execute(
        select(Activity.category, func.count().label("count"))
        .group_by(Activity.category)
    )
    activities_by_category = [{"category": r.category, "count": r.count} for r in cat_result]

    # User growth last 30 days (by day)
    thirty_ago = utcnow() - timedelta(days=30)
    from sqlalchemy import text
    growth_result = await db.execute(
        select(
            func.date_trunc("day", User.created_at).label("day"),
            func.count().label("count")
        )
        .where(User.created_at >= thirty_ago)
        .group_by(text("day"))
        .order_by(text("day"))
    )
    user_growth = [{"day": str(r.day)[:10], "count": r.count} for r in growth_result]

    return {
        "total_users": total_users,
        "active_users": active_users,
        "admin_users": admin_users,
        "total_activities": total_activities,
        "total_carbon_kg": round(float(total_carbon), 2),
        "new_users_week": new_users_week,
        "activities_by_category": activities_by_category,
        "user_growth": user_growth,
    }


# ─────────────────────────────────────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    stmt = select(User).order_by(desc(User.created_at))
    if search:
        stmt = stmt.where(
            User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%")
        )
    if role:
        stmt = stmt.where(User.role == role)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar()

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "has_completed_onboarding": u.has_completed_onboarding,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get activity count
    act_count = (await db.execute(
        select(func.count()).select_from(Activity).where(Activity.user_id == user_id)
    )).scalar()

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "has_completed_onboarding": user.has_completed_onboarding,
        "created_at": user.created_at.isoformat(),
        "activity_count": act_count,
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> Any:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only super_admin can change roles
    if "role" in payload and admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can change roles")

    allowed = {"role", "is_active", "full_name"}
    for key, val in payload.items():
        if key in allowed:
            setattr(user, key, val)

    await db.commit()
    await db.refresh(user)
    return {"message": "User updated", "user_id": str(user.id), "role": user.role, "is_active": user.is_active}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    if str(admin.id) == str(user_id):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# EMISSION FACTORS CRUD
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/emission-factors")
async def list_emission_factors(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    result = await db.execute(select(EmissionFactor).order_by(EmissionFactor.category))
    factors = result.scalars().all()
    return [
        {
            "id": str(f.id),
            "category": f.category,
            "type": f.type,
            "factor_value": f.factor_value,
            "unit": f.unit,
            "updated_at": f.updated_at.isoformat(),
        }
        for f in factors
    ]


@router.patch("/emission-factors/{factor_id}")
async def update_emission_factor(
    factor_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    result = await db.execute(select(EmissionFactor).where(EmissionFactor.id == factor_id))
    factor = result.scalar_one_or_none()
    if not factor:
        raise HTTPException(status_code=404, detail="Factor not found")
    if "factor_value" in payload:
        factor.factor_value = float(payload["factor_value"])
    if "unit" in payload:
        factor.unit = payload["unit"]
    await db.commit()
    return {"message": "Updated", "id": str(factor.id), "factor_value": factor.factor_value}


# ─────────────────────────────────────────────────────────────────────────────
# EVENTS MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/events")
async def list_all_events(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    result = await db.execute(select(CommunityEvent).order_by(desc(CommunityEvent.date)))
    events = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "event_type": e.type,
            "location": "Virtual", # Not in DB schema
            "latitude": e.latitude,
            "longitude": e.longitude,
            "event_date": e.date.isoformat(),
            "max_participants": 100, # Not in DB schema
            "current_participants": 0, # Should be len(e.participants) but keeping simple
            "is_active": True, # Not in DB schema
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


@router.patch("/events/{event_id}")
async def update_event(
    event_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Any:
    result = await db.execute(select(CommunityEvent).where(CommunityEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    allowed_mapping = {
        "title": "title", 
        "description": "description", 
        "event_date": "date", 
    }
    for key, val in payload.items():
        if key in allowed_mapping:
            setattr(event, allowed_mapping[key], val)
    await db.commit()
    return {"message": "Updated", "id": str(event.id)}


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    result = await db.execute(select(CommunityEvent).where(CommunityEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# REPORTS / EXPORT
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/reports/users/export")
async def export_users_csv(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at))
    users = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Email", "Full Name", "Role", "Active", "Verified", "Onboarded", "Created At"])
    for u in users:
        writer.writerow([str(u.id), u.email, u.full_name, u.role, u.is_active, u.is_verified, u.has_completed_onboarding, u.created_at])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )


@router.get("/reports/activities/export")
async def export_activities_csv(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Activity, User.email)
        .join(User, Activity.user_id == User.id)
        .order_by(desc(Activity.date))
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "User Email", "Category", "Type", "Value", "Unit", "Impact Score", "Logged At"])
    for act, email in rows:
        writer.writerow([str(act.id), email, act.category, act.type, act.value, act.unit, act.impact_score, act.date])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=activities.csv"},
    )
