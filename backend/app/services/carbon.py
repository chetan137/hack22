"""
ECOSENSE AI — Carbon Service
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.emission_factor import EmissionFactor

DEFAULT_FACTORS = [
    # Transportation (Assumes miles)
    {"category": "transportation", "type": "car_trip", "factor_value": -0.5, "unit": "miles"},
    {"category": "transportation", "type": "flight", "factor_value": -2.0, "unit": "miles"},
    {"category": "transportation", "type": "ev_trip", "factor_value": -0.1, "unit": "miles"},
    {"category": "transportation", "type": "public_transit", "factor_value": -0.1, "unit": "miles"},
    {"category": "transportation", "type": "bike_walk", "factor_value": 1.0, "unit": "miles"},
    
    # Electricity (Assumes kWh)
    {"category": "electricity", "type": "grid_usage", "factor_value": -0.2, "unit": "kWh"},
    {"category": "electricity", "type": "renewable_usage", "factor_value": 0.5, "unit": "kWh"},
    
    # Water (Assumes gallons)
    {"category": "water", "type": "usage", "factor_value": -0.05, "unit": "gallons"},
    {"category": "water", "type": "saved", "factor_value": 0.1, "unit": "gallons"},
    
    # Waste (Assumes lbs)
    {"category": "waste", "type": "landfill", "factor_value": -1.0, "unit": "lbs"},
    {"category": "waste", "type": "recycled", "factor_value": 2.0, "unit": "lbs"},
    {"category": "waste", "type": "composted", "factor_value": 3.0, "unit": "lbs"},
]

async def seed_emission_factors(db: AsyncSession) -> None:
    """Seed the database with default emission factors if empty."""
    stmt = select(EmissionFactor).limit(1)
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is not None:
        return  # Already seeded
        
    for factor_data in DEFAULT_FACTORS:
        ef = EmissionFactor(
            category=factor_data["category"],
            type=factor_data["type"],
            factor_value=factor_data["factor_value"],
            unit=factor_data["unit"]
        )
        db.add(ef)
    await db.commit()

class CarbonService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_factor(self, category: str, type: str) -> Optional[EmissionFactor]:
        stmt = select(EmissionFactor).where(
            EmissionFactor.category == category,
            EmissionFactor.type == type
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def calculate_impact(self, category: str, type: str, value: float, unit: str) -> float:
        """
        Calculate impact based on DB emission factors.
        Returns 0.0 if factor is not found.
        """
        factor = await self.get_factor(category, type)
        if not factor:
            return 0.0
            
        # In the future, unit conversion logic could be added here if needed
        # (e.g. converting km to miles if factor.unit == "miles" and unit == "km")
        
        return value * factor.factor_value

    async def get_all_factors(self) -> list[EmissionFactor]:
        stmt = select(EmissionFactor)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
