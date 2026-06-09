import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.auth import (
    create_access_token, create_refresh_token,
    decode_refresh_token, hash_password, verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class SignUpBody(BaseModel):
    handle: str
    name: str
    email: EmailStr
    password: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpBody, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.handle == body.handle))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or handle already taken")

    user = User(
        id=uuid.uuid4(),
        handle=body.handle.lower().strip(),
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Account suspended")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=204)
async def change_password(
    body: ChangePasswordBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.password_hash or not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    current_user.password_hash = hash_password(body.new_password)
    db.add(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshBody, db: AsyncSession = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.is_suspended:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
