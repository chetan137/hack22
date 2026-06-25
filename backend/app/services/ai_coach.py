"""
ECOSENSE AI — AI Green Coach Service

Uses Google Gemini via LangChain for conversational AI.
Falls back to a local rules-based engine if Gemini is unavailable.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.chat import ChatMessage
from app.models.activity import Activity
from app.models.eco_profile import EcoProfile
from app.core.config import settings


# ---------- Prompt Templates ----------

SYSTEM_PROMPT = """You are EcoCoach, a friendly and knowledgeable AI sustainability advisor for the ECOSENSE AI platform. 

Your personality:
- Warm, encouraging, and optimistic
- Data-driven but conversational
- You celebrate wins and gently guide improvements
- You use emojis sparingly but effectively (🌱, 🌍, ♻️, 💧, ⚡)

Your capabilities:
- Analyze the user's environmental activity data
- Provide personalized sustainability recommendations
- Suggest weekly challenges to reduce carbon footprint
- Explain environmental concepts in simple terms
- Set goals and track progress

USER CONTEXT:
{user_context}

RECENT ACTIVITIES:
{recent_activities}

CONVERSATION HISTORY:
{conversation_history}

Guidelines:
- Keep responses concise (2-4 paragraphs max)
- Use markdown formatting for lists and emphasis
- Always be actionable — give specific, practical tips
- Reference the user's actual data when available
- If asked about something outside sustainability, politely redirect
"""

WEEKLY_CHALLENGES = [
    {"title": "Meatless Monday", "description": "Go vegetarian for one full day. This can save ~3.6 kg of CO2.", "category": "diet"},
    {"title": "Zero Waste Wednesday", "description": "Produce zero landfill waste for a day. Compost and recycle everything.", "category": "waste"},
    {"title": "Transit Thursday", "description": "Use public transit or bike instead of driving. Track those miles!", "category": "transportation"},
    {"title": "Unplug Friday", "description": "Unplug all non-essential electronics. You'd be surprised how much phantom power they use.", "category": "electricity"},
    {"title": "Shower Timer", "description": "Keep all showers under 5 minutes this week. Save up to 25 gallons per shower!", "category": "water"},
    {"title": "Local Food Week", "description": "Buy only locally sourced food this week. Less transport = less emissions.", "category": "diet"},
    {"title": "Carpool Challenge", "description": "Share rides with a coworker or friend for 5 days straight.", "category": "transportation"},
    {"title": "Energy Audit", "description": "Walk through your home and identify 5 ways to reduce energy usage.", "category": "electricity"},
]

SUSTAINABILITY_TIPS = {
    "transportation": [
        "Consider carpooling — sharing a ride with just one person cuts your per-trip emissions in half.",
        "For short trips under 2 miles, walking or biking saves fuel and keeps you healthy.",
        "If you drive a gas car, maintaining proper tire pressure can improve fuel efficiency by up to 3%.",
        "Working from home even 1 day/week can reduce your commute emissions by 20%.",
    ],
    "electricity": [
        "Switch to LED bulbs — they use 75% less energy and last 25x longer than incandescent bulbs.",
        "Unplug chargers and electronics when not in use. Phantom load can account for 10% of your bill.",
        "Set your thermostat 2°F lower in winter and 2°F higher in summer to save ~5% on energy.",
        "Consider a smart power strip to automatically cut power to idle devices.",
    ],
    "water": [
        "Fix leaky faucets — a drip per second wastes 3,000+ gallons per year.",
        "Install low-flow showerheads to reduce water use by 40% without losing pressure.",
        "Water your lawn early in the morning to reduce evaporation loss by up to 30%.",
        "Run dishwashers and washing machines only with full loads.",
    ],
    "waste": [
        "Start composting food scraps — this can divert up to 30% of household waste from landfills.",
        "Bring reusable bags to the store. The average American uses 365 plastic bags per year.",
        "Buy products with minimal packaging or choose refillable options.",
        "Donate or sell items instead of throwing them away — one person's trash is another's treasure.",
    ],
}


# ---------- Context Builder ----------

async def _build_user_context(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Build context string from user's profile and recent activities."""
    # Get eco profile
    stmt = select(EcoProfile).where(EcoProfile.user_id == user_id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    
    if profile:
        context = f"Eco Score: {profile.eco_score}/2000"
    else:
        context = "No eco profile found yet."
    
    return context


async def _get_recent_activities_text(db: AsyncSession, user_id: uuid.UUID, limit: int = 10) -> str:
    """Get recent activities as formatted text."""
    stmt = (
        select(Activity)
        .where(Activity.user_id == user_id)
        .order_by(desc(Activity.date))
        .limit(limit)
    )
    result = await db.execute(stmt)
    activities = result.scalars().all()
    
    if not activities:
        return "No activities logged yet."
    
    lines = []
    for a in activities:
        date_str = a.date.strftime("%b %d") if a.date else "N/A"
        lines.append(f"- [{date_str}] {a.category}/{a.type}: {a.value} {a.unit} (impact: {a.impact_score:+.1f})")
    return "\n".join(lines)


async def _get_conversation_history(db: AsyncSession, user_id: uuid.UUID, limit: int = 10) -> str:
    """Get recent conversation history."""
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(desc(ChatMessage.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = list(reversed(result.scalars().all()))
    
    if not messages:
        return "No previous conversation."
    
    lines = []
    for m in messages:
        role = "User" if m.role == "user" else "EcoCoach"
        lines.append(f"{role}: {m.content}")
    return "\n".join(lines)


# ---------- AI Response Generation ----------

async def _generate_with_gemini(prompt: str) -> Optional[str]:
    """Try to generate response using Gemini API via LangChain."""
    try:
        gemini_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not gemini_key:
            return None
            
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=gemini_key,
            temperature=0.7,
            max_output_tokens=1024,
        )
        
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return None


def _generate_local_response(user_message: str, user_context: str, recent_activities: str) -> str:
    """Fallback: generate a response using local rules engine."""
    msg_lower = user_message.lower()
    
    # Check for challenge requests
    if any(w in msg_lower for w in ["challenge", "weekly", "goal"]):
        import random
        challenge = random.choice(WEEKLY_CHALLENGES)
        return (
            f"🌱 **Weekly Challenge: {challenge['title']}**\n\n"
            f"{challenge['description']}\n\n"
            f"This challenge focuses on **{challenge['category']}**. "
            f"Log your progress in the Activity Tracker to see your impact grow!"
        )
    
    # Check for tip requests by category
    for category, tips in SUSTAINABILITY_TIPS.items():
        if category in msg_lower:
            import random
            tip = random.choice(tips)
            return (
                f"💡 **{category.title()} Tip:**\n\n{tip}\n\n"
                f"Want more tips on {category} or another category? Just ask!"
            )
    
    # Check for score/progress questions
    if any(w in msg_lower for w in ["score", "progress", "how am i", "status"]):
        return (
            f"📊 **Your Current Status:**\n\n{user_context}\n\n"
            f"**Recent Activity:**\n{recent_activities}\n\n"
            f"Keep logging your activities to improve your Eco Score! "
            f"Every small action adds up to a big impact. 🌍"
        )
    
    # General sustainability question
    if any(w in msg_lower for w in ["tip", "advice", "suggest", "recommend", "help", "how"]):
        import random
        all_tips = [tip for tips in SUSTAINABILITY_TIPS.values() for tip in tips]
        tip = random.choice(all_tips)
        return (
            f"🌿 Here's a sustainability tip for you:\n\n{tip}\n\n"
            f"Would you like tips on a specific area? Try asking about "
            f"**transportation**, **electricity**, **water**, or **waste**!"
        )
    
    # Default greeting / catch-all
    return (
        "👋 Hey there! I'm your **EcoCoach** — your personal sustainability advisor.\n\n"
        "Here's what I can help you with:\n"
        "- 🌱 **Weekly Challenges** — Ask me for a new challenge\n"
        "- 💡 **Sustainability Tips** — Get tips on transportation, electricity, water, or waste\n"
        "- 📊 **Progress Review** — Ask about your eco score and recent activity\n"
        "- 🎯 **Goal Setting** — Let's set sustainability goals together\n\n"
        "What would you like to explore? 🌍"
    )


# ---------- Main Chat Function ----------

async def chat(db: AsyncSession, user_id: uuid.UUID, user_message: str) -> str:
    """Process a user message and return the AI coach response."""
    # Save user message
    user_msg = ChatMessage(user_id=user_id, role="user", content=user_message)
    db.add(user_msg)
    
    # Build context
    user_context = await _build_user_context(db, user_id)
    recent_activities = await _get_recent_activities_text(db, user_id)
    conversation_history = await _get_conversation_history(db, user_id)
    
    # Try Gemini first, fall back to local
    full_prompt = SYSTEM_PROMPT.format(
        user_context=user_context,
        recent_activities=recent_activities,
        conversation_history=conversation_history,
    ) + f"\n\nUser: {user_message}\nEcoCoach:"
    
    response_text = await _generate_with_gemini(full_prompt)
    
    if not response_text:
        response_text = _generate_local_response(user_message, user_context, recent_activities)
    
    # Save assistant response
    assistant_msg = ChatMessage(user_id=user_id, role="assistant", content=response_text)
    db.add(assistant_msg)
    await db.commit()
    
    return response_text


async def get_chat_history(db: AsyncSession, user_id: uuid.UUID, limit: int = 50) -> list[dict]:
    """Get chat history for a user."""
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


async def get_suggested_actions() -> list[dict]:
    """Return suggested quick actions for the UI."""
    return [
        {"label": "🌱 Weekly Challenge", "message": "Give me a weekly challenge"},
        {"label": "📊 My Progress", "message": "How am I doing?"},
        {"label": "💡 Sustainability Tips", "message": "Give me a sustainability tip"},
        {"label": "🚗 Transport Tips", "message": "How can I reduce transportation emissions?"},
        {"label": "⚡ Energy Tips", "message": "Tips for reducing electricity usage"},
        {"label": "💧 Water Tips", "message": "How can I save water?"},
    ]
