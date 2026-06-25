"""
ECOSENSE AI — AI Green Coach API Endpoints
"""

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.services.ai_coach import chat, get_chat_history, get_suggested_actions

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


@router.get("/history", response_model=list[ChatMessageOut])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Retrieve the user's chat history."""
    return await get_chat_history(db, current_user.id)


@router.post("/chat", response_model=ChatResponse)
async def send_chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Send a message to the AI Green Coach and get a response."""
    response_text = await chat(db, current_user.id, data.message)
    return {"response": response_text}


@router.get("/suggestions")
async def get_suggestions(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get suggested quick actions for the chat UI."""
    return await get_suggested_actions()
