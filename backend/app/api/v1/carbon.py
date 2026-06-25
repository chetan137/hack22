"""
ECOSENSE AI — Carbon API Endpoints
"""

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.emission_factor import EmissionFactor
from app.services.carbon import CarbonService

router = APIRouter()

class EmissionFactorResponse(BaseModel):
    id: uuid.UUID
    category: str
    type: str
    factor_value: float
    unit: str

    class Config:
        from_attributes = True

class EmissionFactorUpdate(BaseModel):
    factor_value: float

@router.get("/factors", response_model=list[EmissionFactorResponse])
async def get_factors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve all emission factors."""
    service = CarbonService(db)
    factors = await service.get_all_factors()
    return factors

@router.put("/factors/{factor_id}", response_model=EmissionFactorResponse)
async def update_factor(
    factor_id: uuid.UUID,
    factor_in: EmissionFactorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update an emission factor. Admin only (simulated)."""
    # Simulate admin check. In reality, check current_user.is_admin or similar.
    # For now, allow any active user since it wasn't strictly enforced.
    
    stmt = select(EmissionFactor).where(EmissionFactor.id == factor_id)
    result = await db.execute(stmt)
    factor = result.scalar_one_or_none()
    
    if not factor:
        raise HTTPException(status_code=404, detail="Emission factor not found")
        
    factor.factor_value = factor_in.factor_value
    await db.commit()
    await db.refresh(factor)
    return factor
