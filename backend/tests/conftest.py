import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from typing import AsyncGenerator

from app.core.database import Base
from app.core.config import settings
from app.main import app
from app.core.security import create_access_token

# Use an in-memory SQLite DB for testing
# Actually, since we use asyncpg and PostgreSQL specific types (UUID),
# we might need to use PostgreSQL. For simplicity, we can use the same DEV database
# but we should be careful. We'll just use the default engine from settings but we will
# wrap tests in a transaction that rolls back.

from app.core.database import engine, async_session_factory

@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        # Create all tables (if not exist)
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_factory() as session:
        yield session
        await session.rollback() # Rollback at end of test

@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture(scope="function")
async def test_user_token_headers(db_session: AsyncSession) -> dict[str, str]:
    import uuid
    from app.models.user import User
    from app.core.security import create_access_token
    
    user_id = uuid.uuid4()
    test_user = User(
        id=user_id,
        email=f"test_{user_id}@example.com",
        hashed_password="fakehashedpassword",
        full_name="Test User",
        is_active=True,
        is_verified=True,
        has_completed_onboarding=False
    )
    db_session.add(test_user)
    await db_session.commit()
    
    token = create_access_token(subject=str(user_id))
    return {"Authorization": f"Bearer {token}"}

