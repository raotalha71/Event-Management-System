"""Connections / friend-request endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.database import get_database

router = APIRouter(prefix="/api/connections", tags=["connections"])


class ConnectRequest(BaseModel):
    target_user_id: str


class ConnectionResponse(BaseModel):
    id: str
    from_user: dict
    to_user: dict
    status: str
    created_at: str


def _user_summary(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "name": u.get("name", "Unknown"),
        "company": u.get("company"),
        "industry": u.get("industry"),
        "interests": u.get("interests", []),
        "avatar": u.get("avatar"),
    }


@router.post("/request")
async def send_connection_request(
    body: ConnectRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Send a connection / friend request."""
    db = await get_database()

    if body.target_user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself.")

    # Check not already connected
    existing = await db.connections.find_one({
        "$or": [
            {"from_user_id": user_id, "to_user_id": body.target_user_id},
            {"from_user_id": body.target_user_id, "to_user_id": user_id},
        ]
    })
    if existing:
        status = existing.get("status", "pending")
        if status == "accepted":
            raise HTTPException(status_code=409, detail="Already connected.")
        raise HTTPException(status_code=409, detail="Connection request already pending.")

    doc = {
        "from_user_id": user_id,
        "to_user_id": body.target_user_id,
        "status": "accepted",          # auto-accept for MVP
        "created_at": datetime.utcnow(),
    }
    await db.connections.insert_one(doc)
    return {"success": True, "message": "Connected!"}


@router.get("/mine")
async def my_connections(user_id: str = Depends(get_current_user_id)):
    """List all connections for the current user."""
    db = await get_database()

    raw = await db.connections.find({
        "$or": [
            {"from_user_id": user_id},
            {"to_user_id": user_id},
        ],
        "status": "accepted",
    }).to_list(200)

    # Resolve peer user docs
    connections = []
    for c in raw:
        peer_id = c["to_user_id"] if c["from_user_id"] == user_id else c["from_user_id"]
        if not ObjectId.is_valid(peer_id):
            continue
        peer = await db.users.find_one({"_id": ObjectId(peer_id)})
        if not peer:
            continue
        connections.append({
            "id": str(c["_id"]),
            "peer": _user_summary(peer),
            "connected_at": c["created_at"].isoformat() if isinstance(c["created_at"], datetime) else str(c["created_at"]),
        })

    return connections


@router.delete("/{connection_id}")
async def remove_connection(
    connection_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = await get_database()
    if not ObjectId.is_valid(connection_id):
        raise HTTPException(status_code=400, detail="Invalid connection id")

    result = await db.connections.delete_one({
        "_id": ObjectId(connection_id),
        "$or": [
            {"from_user_id": user_id},
            {"to_user_id": user_id},
        ],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True}
