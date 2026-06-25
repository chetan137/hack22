import asyncio
from app.core.database import async_session_factory
from app.schemas.auth import UserCreate
from app.services.auth import register_user

async def seed():
    async with async_session_factory() as db:
        user_in = UserCreate(
            email="testuser_e2e@example.com",
            password="password123",
            full_name="Demo User"
        )
        try:
            user = await register_user(db, user_in)
            await db.commit()
            print(f"Successfully seeded user: {user.email}")
        except Exception as e:
            print(f"Failed to seed user or already exists: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
