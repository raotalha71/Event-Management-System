from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo
from app.routers import ai, auth_router, connections, events, organizations, payment, registration, tickets, waitlist

app = FastAPI(
    title="Event Platform API",
    description="Advanced Registration System with Payment Integration",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()


app.include_router(auth_router.router)
app.include_router(events.router)
app.include_router(organizations.router)
app.include_router(ai.router)
app.include_router(connections.router)
app.include_router(registration.router)
app.include_router(payment.router)
app.include_router(tickets.router)
app.include_router(waitlist.router)


@app.get("/")
async def root():
    return {
        "message": "Event Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "api_url": settings.api_url,
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
