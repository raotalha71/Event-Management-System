from __future__ import annotations

from fastapi import APIRouter

from app.database import get_database

from app.ai.networking import conversation_starter, recommend_connections
from app.ai.rag import RagEngine
from app.schemas.ai import (
    AiHealthResponse,
    NetworkingRecommendation,
    NetworkingRequest,
    RagChatRequest,
    RagChatResponse,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])

_engine = RagEngine()


@router.get("/health", response_model=AiHealthResponse)
async def ai_health():
    return AiHealthResponse(ok=True, rag_backend="sentence-transformers" if _engine._use_st else "token-jaccard")


@router.post("/networking/recommendations", response_model=list[NetworkingRecommendation])
async def networking_recommendations(payload: NetworkingRequest):
    subject = payload.user or {}
    candidates = payload.attendees or []

    matches = recommend_connections(subject, candidates, limit=payload.limit, min_score=0.0)
    results: list[NetworkingRecommendation] = []

    for entry in matches:
        match = entry["match"]
        overlap = entry.get("overlap", {})
        results.append(
            NetworkingRecommendation(
                name=match.get("name", "Unknown"),
                reason=entry.get("reason", ""),
                starter=conversation_starter(subject, match, overlap),
                score=float(entry.get("score", 0.0)),
                match=match,
            )
        )

    return results


@router.get("/rag/snapshot", response_model=dict)
async def rag_snapshot():
    """Build a comprehensive snapshot from MongoDB for RAG context.

    Pulls events, users (attendees), registrations, and injects rich FAQ data
    so the chatbot can answer questions about the platform, events, attendees,
    networking, and logistics.
    """

    db = await get_database()

    # ── Events ────────────────────────────────────────────────────────────
    events_raw = await db.events.find({}).sort("start_date", 1).to_list(200)
    events = []
    for e in events_raw:
        events.append(
            {
                "id": str(e.get("_id")),
                "name": e.get("name"),
                "description": e.get("description"),
                "startDate": (e.get("start_date").isoformat() if e.get("start_date") else None),
                "endDate": (e.get("end_date").isoformat() if e.get("end_date") else None),
                "location": e.get("location"),
                "organizerId": e.get("organizer_id"),
                "capacity": e.get("capacity"),
                "registeredCount": e.get("registered_count", 0),
                "status": (str(e.get("status")) if e.get("status") is not None else "draft"),
                "revenue": e.get("revenue", 0),
            }
        )

    # ── Attendees from users collection ───────────────────────────────────
    users_raw = await db.users.find({}).to_list(500)
    seen_attendees: set[str] = set()
    attendees = []
    for u in users_raw:
        uid = str(u.get("_id"))
        if uid in seen_attendees:
            continue
        seen_attendees.add(uid)
        attendees.append(
            {
                "id": uid,
                "name": u.get("name", "Unknown"),
                "email": u.get("email"),
                "company": u.get("company"),
                "industry": u.get("industry"),
                "role": u.get("role", "ATTENDEE"),
                "interests": u.get("interests", []),
            }
        )

    # ── Also pull from registrations (legacy) ─────────────────────────────
    registrations_raw = await db.registrations.find({}).sort("created_at", -1).to_list(500)
    for r in registrations_raw:
        form_responses = r.get("form_responses")
        interests: list[str] = []
        if isinstance(form_responses, dict):
            raw_interests = form_responses.get("interests")
            if isinstance(raw_interests, list):
                interests = [str(x) for x in raw_interests if x]
            elif isinstance(raw_interests, str):
                interests = [s.strip() for s in raw_interests.split(",") if s.strip()]

        attendee_id = str(r.get("user_id") or r.get("_id"))
        if attendee_id in seen_attendees:
            continue
        seen_attendees.add(attendee_id)
        name = " ".join([r.get("first_name") or "", r.get("last_name") or ""]).strip() or "Attendee"
        attendees.append(
            {
                "id": attendee_id,
                "name": name,
                "email": r.get("email"),
                "company": r.get("company"),
                "industry": None,
                "role": r.get("job_title"),
                "interests": interests,
            }
        )

    # ── Rich FAQ ──────────────────────────────────────────────────────────
    total_events = len(events)
    total_attendees = len(attendees)
    total_capacity = sum(e.get("capacity", 0) for e in events)
    total_registrations = sum(e.get("registeredCount", 0) for e in events)
    event_names = ", ".join(e.get("name", "Untitled") for e in events[:10]) or "No events yet"
    event_locations = ", ".join(set(e.get("location", "") for e in events if e.get("location"))) or "No locations set"

    faq = [
        {
            "question": "Where can I find event schedules and venue information?",
            "answer": "Use the Dashboard for event summaries and the Venue Editor for layout details. For live sessions, check the Event Hub.",
            "category": "logistics",
            "audience": "attendee",
        },
        {
            "question": "How many events are there? What events do we have?",
            "answer": f"There are currently {total_events} events on the platform: {event_names}.",
            "category": "overview",
            "audience": "all",
        },
        {
            "question": "How many attendees or users are registered?",
            "answer": f"There are {total_attendees} registered users on the platform, with {total_registrations} total event registrations across {total_events} events.",
            "category": "overview",
            "audience": "organizer",
        },
        {
            "question": "What is the total capacity across all events?",
            "answer": f"The combined capacity across all events is {total_capacity} seats.",
            "category": "overview",
            "audience": "organizer",
        },
        {
            "question": "Where are the events located? What are the event locations?",
            "answer": f"Events are located at: {event_locations}.",
            "category": "logistics",
            "audience": "attendee",
        },
        {
            "question": "How does AI networking work?",
            "answer": "The AI Networking feature uses weighted-similarity matching based on your interests, industry, and company to recommend the best people to connect with at events. Update your profile interests to get better matches.",
            "category": "feature",
            "audience": "attendee",
        },
        {
            "question": "How do I update my profile or interests?",
            "answer": "Go to the 'My Profile' section from the sidebar or click your avatar in the top-right. You can update your name, company, industry, phone, and interests there. Interests directly affect AI networking recommendations.",
            "category": "feature",
            "audience": "attendee",
        },
        {
            "question": "What features does EventNexus offer?",
            "answer": "EventNexus offers: Dashboard analytics, Event creation & management, AI Networking (smart attendee matching), RAG-powered AI Assistant, Venue Editor (interactive floor plans), Badge generation, Session management with live polls, Q&A, and real-time engagement tracking.",
            "category": "feature",
            "audience": "all",
        },
        {
            "question": "How do I create a new event?",
            "answer": "As an organizer, go to the Dashboard and click 'Create New Event'. Fill in the name, date, location, capacity, and description. The event will be saved to MongoDB and visible on the platform immediately.",
            "category": "feature",
            "audience": "organizer",
        },
        {
            "question": "What technology stack does this platform use?",
            "answer": "The backend uses FastAPI (Python) with MongoDB Atlas for the database. Authentication uses JWT tokens with bcrypt password hashing. The frontend is React 19 with TypeScript, Vite, and TailwindCSS. AI features use sentence-transformers for semantic search and token-Jaccard as a fallback.",
            "category": "technical",
            "audience": "all",
        },
        {
            "question": "How do I register for an event?",
            "answer": "Navigate to the Events section, find the event you want to attend, and click Register. You'll receive a QR code ticket for check-in.",
            "category": "logistics",
            "audience": "attendee",
        },
        {
            "question": "Who are the attendees? List the registered users.",
            "answer": f"There are {total_attendees} registered users. " + (
                "Some attendees include: " + ", ".join(
                    f"{a.get('name', 'Unknown')} ({a.get('company') or 'no company'})"
                    for a in attendees[:8]
                ) + "." if attendees else "No attendees registered yet."
            ),
            "category": "networking",
            "audience": "all",
        },
    ]

    return {"events": events, "sessions": [], "attendees": attendees, "faq": faq}


@router.post("/rag/chat", response_model=RagChatResponse)
async def rag_chat(payload: RagChatRequest):
    snapshot = payload.snapshot
    if snapshot is None:
        snapshot = await rag_snapshot()

    documents = _engine.build_documents(snapshot)
    result = _engine.answer(payload.query, documents)
    return RagChatResponse(**result)
