"""Reset admin user password"""
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ecosense:ecosense@localhost:5433/ecosense"
NEW_PASSWORD = "Admin@123"

async def run():
    engine = create_async_engine(DATABASE_URL)
    hashed = bcrypt.hashpw(NEW_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    async with engine.begin() as conn:
        result = await conn.execute(
            text("UPDATE users SET hashed_password = :pwd WHERE role IN ('admin', 'super_admin') RETURNING email"),
            {"pwd": hashed}
        )
        rows = result.fetchall()
        for row in rows:
            print(f"RESET password for: {row[0]}")
    print(f"\nNew password: {NEW_PASSWORD}")

if __name__ == "__main__":
    asyncio.run(run())
