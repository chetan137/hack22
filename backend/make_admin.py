import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)

async def run():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE users SET role='super_admin'"))
    print("Updated all users to super_admin")

if __name__ == "__main__":
    asyncio.run(run())
