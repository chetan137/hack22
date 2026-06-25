"""
ECOSENSE AI — Auth Endpoints
"""

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
    UserCreate,
    UserLogin,
)
from app.schemas.user import UserResponse
from app.services import auth as auth_service

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Register a new user."""
    user = await auth_service.register_user(db, user_in)
    return user


@router.post("/login", response_model=TokenPair)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """OAuth2 compatible token login, getting an access token for future requests."""
    user, tokens = await auth_service.authenticate_user(
        db, login_data.email, login_data.password
    )
    return tokens


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(
    refresh_data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Refresh access token using refresh token."""
    return await auth_service.refresh_tokens(db, refresh_data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    refresh_data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke refresh token."""
    await auth_service.logout_user(db, refresh_data.refresh_token)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Request password reset (stubbed email send)."""
    await auth_service.request_password_reset(db, request.email)
    return {"message": "If the email is registered, a reset link will be sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Reset password using token."""
    await auth_service.reset_password(db, request.token, request.new_password)
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user."""
    return current_user
