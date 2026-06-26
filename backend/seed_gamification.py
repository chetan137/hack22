import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory, engine, Base
from app.models.gamification import Badge, GamificationProfile
from app.models.community_event import CommunityEvent
from app.models.user import User

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # Seed Badges
        badges_data = [
            {"name": "First Step", "description": "Logged your first eco-activity", "icon_name": "Footprint", "points_required": 10},
            {"name": "Week Warrior", "description": "Maintained a 7-day streak", "icon_name": "Flame", "points_required": 100},
            {"name": "Recycling Pro", "description": "Logged 10 recycling activities", "icon_name": "Recycle", "points_required": 250},
            {"name": "Carbon Cutter", "description": "Saved 100kg of CO2", "icon_name": "CloudRain", "points_required": 500},
            {"name": "Tree Hugger", "description": "Planted a tree or joined a plantation drive", "icon_name": "TreePine", "points_required": 750},
            {"name": "Eco Champion", "description": "Reached Climate Guardian level", "icon_name": "Trophy", "points_required": 1500},
        ]
        
        for b_data in badges_data:
            existing = await db.execute(Badge.__table__.select().where(Badge.name == b_data["name"]))
            if not existing.scalar_one_or_none():
                badge = Badge(**b_data)
                db.add(badge)

        # Seed Community Events (around Mumbai/Thane for the user's location)
        events_data = [
            {
                "title": "Sanjay Gandhi Park Cleanup",
                "type": "NGO",
                "latitude": 19.2140,
                "longitude": 72.9106,
                "date": datetime.now(timezone.utc) + timedelta(days=2),
                "description": "Join us to clean up the trails and protect local wildlife.",
                "points_reward": 150
            },
            {
                "title": "Thane Creek Flamingo Festival",
                "type": "Community Event",
                "latitude": 19.1672,
                "longitude": 72.9868,
                "date": datetime.now(timezone.utc) + timedelta(days=5),
                "description": "Awareness drive and coastal cleanup near the flamingo sanctuary.",
                "points_reward": 100
            },
            {
                "title": "Electronic Waste Drive",
                "type": "Recycling Center",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "date": datetime.now(timezone.utc) + timedelta(days=1),
                "description": "Drop off old electronics for safe recycling and earn eco points.",
                "points_reward": 200
            },
            {
                "title": "Aarey Forest Plantation",
                "type": "Plantation Drive",
                "latitude": 19.1485,
                "longitude": 72.8810,
                "date": datetime.now(timezone.utc) + timedelta(days=10),
                "description": "Help us plant 500 indigenous saplings in Aarey colony.",
                "points_reward": 300
            }
        ]

        for e_data in events_data:
            existing = await db.execute(CommunityEvent.__table__.select().where(CommunityEvent.title == e_data["title"]))
            if not existing.scalar_one_or_none():
                event = CommunityEvent(**e_data)
                db.add(event)

        # Seed gamification profiles for existing users
        result_users = await db.execute(User.__table__.select())
        users = result_users.fetchall()
        for u in users:
            existing_prof = await db.execute(GamificationProfile.__table__.select().where(GamificationProfile.user_id == u.id))
            if not existing_prof.scalar_one_or_none():
                # Randomize points a bit for the leaderboard
                import random
                pts = random.randint(100, 4000)
                lvl = "Eco Rookie"
                if pts >= 500: lvl = "Green Explorer"
                if pts >= 1500: lvl = "Climate Guardian"
                if pts >= 3000: lvl = "Planet Protector"
                
                prof = GamificationProfile(
                    user_id=u.id, 
                    total_eco_points=pts, 
                    current_level=lvl,
                    current_streak=random.randint(0, 10),
                    highest_streak=random.randint(5, 20)
                )
                db.add(prof)

        await db.commit()
        print("Database seeded with gamification and community events data.")

if __name__ == "__main__":
    asyncio.run(seed_data())
