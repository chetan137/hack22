"""
ECOSENSE AI — Tests for Carbon Calculation Engine
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.emission_factor import EmissionFactor
from app.services.carbon import CarbonService

@pytest.mark.asyncio
async def test_carbon_service_calculate_impact(db_session: AsyncSession):
    # Ensure factors are seeded
    from app.services.carbon import seed_emission_factors
    await seed_emission_factors(db_session)
    
    service = CarbonService(db_session)
    
    # Test existing factor
    impact = await service.calculate_impact("transportation", "car_trip", 100, "miles")
    # car_trip factor = -0.5
    assert impact == -50.0
    
    # Test missing factor returns 0
    impact_missing = await service.calculate_impact("transportation", "spaceship", 100, "miles")
    assert impact_missing == 0.0

@pytest.mark.asyncio
async def test_get_factors_api(async_client: AsyncClient, db_session: AsyncSession, test_user_token_headers):
    # Ensure factors are seeded
    from app.services.carbon import seed_emission_factors
    await seed_emission_factors(db_session)
    
    response = await async_client.get(
        "/api/v1/carbon/factors",
        headers=test_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    # Check that structure matches
    assert "category" in data[0]
    assert "type" in data[0]
    assert "factor_value" in data[0]

@pytest.mark.asyncio
async def test_update_factor_api(async_client: AsyncClient, db_session: AsyncSession, test_user_token_headers):
    # Ensure factors are seeded
    from app.services.carbon import seed_emission_factors
    await seed_emission_factors(db_session)
    
    # Fetch a factor
    stmt = select(EmissionFactor).limit(1)
    factor = (await db_session.execute(stmt)).scalar_one()
    
    # Update via API
    new_value = factor.factor_value + 1.0
    response = await async_client.put(
        f"/api/v1/carbon/factors/{factor.id}",
        json={"factor_value": new_value},
        headers=test_user_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["factor_value"] == new_value
    
    # Verify in DB
    await db_session.refresh(factor)
    assert factor.factor_value == new_value
