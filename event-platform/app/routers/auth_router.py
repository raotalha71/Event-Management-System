"""Authentication endpoints: signup, login, current-user profile."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth import (
    create_access_token,
    get_current_user_id,
    get_password_hash,
    verify_password,
)
from app.database import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    company: Optional[str] = None
    industry: Optional[str] = None
    interests: list[str] = []
    skills: list[str] = []
    goals: list[str] = []
    role: str = "ATTENDEE"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    interests: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    goals: Optional[list[str]] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "ATTENDEE"),
        "company": user.get("company"),
        "industry": user.get("industry"),
        "interests": user.get("interests", []),
        "skills": user.get("skills", []),
        "goals": user.get("goals", []),
        "avatar": user.get("avatar"),
        "phone": user.get("phone"),
        "created_at": user.get("created_at", "").isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", "")),
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest):
    db = await get_database()

    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    now = datetime.utcnow()
    user_doc = {
        "name": body.name,
        "email": body.email,
        "password_hash": get_password_hash(body.password),
        "role": body.role,
        "company": body.company,
        "industry": body.industry,
        "interests": body.interests,
        "skills": body.skills,
        "goals": body.goals,
        "avatar": None,
        "phone": None,
        "email_verified": False,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})

    return AuthResponse(
        access_token=token,
        user=_serialize_user(user_doc),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    db = await get_database()

    user = await db.users.find_one({"email": body.email})
    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": datetime.utcnow()}},
    )

    token = create_access_token({"sub": str(user["_id"])})

    return AuthResponse(
        access_token=token,
        user=_serialize_user(user),
    )


@router.get("/me")
async def get_profile(user_id: str = Depends(get_current_user_id)):
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _serialize_user(user)


@router.put("/me")
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    db = await get_database()
    updates: dict = {"updated_at": datetime.utcnow()}

    for field in ("name", "company", "industry", "interests", "skills", "goals", "avatar", "phone"):
        val = getattr(body, field)
        if val is not None:
            updates[field] = val

    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    return _serialize_user(user)


@router.get("/attendees")
async def list_attendees():
    """List all registered users (public profiles for networking)."""
    db = await get_database()
    users = await db.users.find().to_list(500)
    return [_serialize_user(u) for u in users]
