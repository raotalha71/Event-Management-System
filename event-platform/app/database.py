from typing import Optional

import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

from .config import settings


class Database:
    """Holds the MongoDB client reference for global reuse."""

    client: Optional[AsyncIOMotorClient] = None


db = Database()


async def get_database():
    if not db.client:
        raise RuntimeError("MongoDB client is not initialized")
    return db.client[settings.database_name]


async def _create_indexes() -> None:
    database = await get_database()

    try:
        await database.organizations.create_index("slug", unique=True)
        await database.users.create_index("email", unique=True)
        await database.user_organizations.create_index(
            [("user_id", 1), ("organization_id", 1)], unique=True
        )
        await database.user_organizations.create_index("user_id")
        await database.user_organizations.create_index("organization_id")

        await database.events.create_index("slug", unique=True)
        await database.events.create_index("organization_id")
        await database.events.create_index("start_date")
        await database.events.create_index("created_at")
        await database.events.create_index("organizer_id")

        await database.ticket_types.create_index("event_id")
        await database.ticket_types.create_index("is_active")
        await database.ticket_types.create_index("sort_order")

        await database.registrations.create_index(
            [("event_id", 1), ("email", 1)], unique=True
        )
        await database.registrations.create_index("event_id")
        await database.registrations.create_index("user_id")
        await database.registrations.create_index("status")
        await database.registrations.create_index("qr_code", unique=True)
        await database.registrations.create_index("created_at")

        await database.waitlist_entries.create_index(
            [("event_id", 1), ("ticket_type_id", 1), ("position", 1)]
        )
    except PyMongoError as exc:
        # Index creation should not block startup in dev.
        print(f"Warning: index creation failed: {exc}")


async def connect_to_mongo() -> None:
    # tlsCAFile for proper cert chain; tlsAllowInvalidCertificates as
    # fallback when Atlas cluster has TLS negotiation issues.
    try:
        db.client = AsyncIOMotorClient(
            settings.mongodb_url,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
        )
        # Quick connectivity check
        await db.client.server_info()
    except Exception:
        # Fallback: skip certificate validation (dev/network issues)
        db.client = AsyncIOMotorClient(
            settings.mongodb_url,
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=10000,
        )
    await _create_indexes()
    print("Connected to MongoDB")


async def close_mongo_connection() -> None:
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")
