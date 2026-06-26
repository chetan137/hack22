"""Reset demo user and admin user passwords"""
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://ecosense:ecosense@localhost:5433/ecosense"

async def run():
    engine = create_async_engine(DATABASE_URL)
    
    # 1. Reset demo user to password123
    demo_hashed = bcrypt.hashpw("password123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    # 2. Reset admin user to Admin@123
    admin_hashed = bcrypt.hashpw("Admin@123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    async with engine.begin() as conn:
        # Update Demo User
        await conn.execute(
            text("UPDATE users SET hashed_password = :pwd WHERE email = 'testuser_e2e@example.com'"),
            {"pwd": demo_hashed}
        )
        print("RESET password for Demo User to: password123")
        
        # Update Admin User
        await conn.execute(
            text("UPDATE users SET hashed_password = :pwd WHERE email = 'aachalpandey2611@gmail.com' OR role = 'super_admin' AND email != 'testuser_e2e@example.com'"),
            {"pwd": admin_hashed}
        )
        print("RESET password for Admin User to: Admin@123")

if __name__ == "__main__":
    asyncio.run(run())
