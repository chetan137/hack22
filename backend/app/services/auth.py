"""
ECOSENSE AI — Auth Service Logic
"""

from datetime import datetime, timezone
import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_password_reset_token,
)
from app.models.user import RefreshToken, User
from app.schemas.auth import TokenPair, UserCreate

logger = logging.getLogger(__name__)


async def register_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user."""
    # Check if user exists
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    await db.flush()  # to get user.id
    
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> tuple[User, TokenPair]:
    """Authenticate user and return tokens."""
    # Find user
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Generate tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token_str = create_refresh_token()

    # Store refresh token
    refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc)
        + __import__("datetime").timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_token)
    
    return user, TokenPair(
        access_token=access_token,
        refresh_token=refresh_token_str,
    )


async def refresh_tokens(db: AsyncSession, refresh_token_str: str) -> TokenPair:
    """Issue new tokens using a valid refresh token."""
    # Find token
    stmt = select(RefreshToken).where(RefreshToken.token == refresh_token_str)
    result = await db.execute(stmt)
    token_obj = result.scalar_one_or_none()

    if not token_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if token_obj.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked",
        )

    if token_obj.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Invalidate old token
    token_obj.revoked = True
    
    # Get user
    stmt_user = select(User).where(User.id == token_obj.user_id)
    user_result = await db.execute(stmt_user)
    user = user_result.scalar_one()

    # Generate new tokens
    access_token = create_access_token(subject=str(user.id))
    new_refresh_token_str = create_refresh_token()

    new_refresh_token = RefreshToken(
        token=new_refresh_token_str,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc)
        + __import__("datetime").timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh_token)

    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh_token_str,
    )


async def logout_user(db: AsyncSession, refresh_token_str: str) -> None:
    """Revoke a refresh token."""
    stmt = select(RefreshToken).where(RefreshToken.token == refresh_token_str)
    result = await db.execute(stmt)
    token_obj = result.scalar_one_or_none()
    
    if token_obj:
        token_obj.revoked = True


async def request_password_reset(db: AsyncSession, email: str) -> None:
    """Generate a password reset token and 'send' email (stubbed)."""
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user:
        reset_token = create_password_reset_token(email)
        # In a real app, send an email here. We just log it.
        logger.warning(
            f"STUB: Password reset requested for {email}. Token: {reset_token}"
        )


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    """Reset user password using a valid token."""
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
        
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
        
    user.hashed_password = hash_password(new_password)
