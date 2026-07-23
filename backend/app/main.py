"""
main.py
-------
FastAPI Application Entry Point for TrustPatch Backend.

This file:
  1. Creates the FastAPI app instance with metadata
  2. Configures CORS middleware (allows React frontend on localhost:5173)
  3. Creates all database tables via SQLAlchemy
  4. Registers all routers (upload, baseline, trustpatch, history)
  5. Provides a health check endpoint at GET /health
  6. Serves the API documentation at GET /docs (Swagger UI)

Running:
  Local:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  Docker: handled by Dockerfile CMD
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app.models import VisitorCount
from app.routers import upload, baseline, trustpatch, history

# ---------------------------------------------------------------------------
# Create all DB tables on startup (idempotent — won't recreate if exists)
# ---------------------------------------------------------------------------
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# FastAPI App Instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="TrustPatch API",
    description=(
        "Trust-Aware and Explainable Self-Healing Framework for Reliable Software Systems. "
        "Compares Baseline APR (BAPR) with Trust-Aware APR (TAPR) across 10 trust dimensions."
    ),
    version="1.0.0",
    docs_url="/docs",          # Swagger UI
    redoc_url="/redoc",        # ReDoc UI
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
# Allow requests from the React frontend (Vite dev server on port 5173)
# and any localhost ports for development flexibility.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # Allow all origins (Vercel deployment domains)
    allow_credentials=False,       # Must be False when allow_origins=["*"]
    allow_methods=["*"],           # Allow all HTTP methods
    allow_headers=["*"],           # Allow all headers
)

# ---------------------------------------------------------------------------
# Register Routers
# ---------------------------------------------------------------------------
# Each router handles a specific concern (separation of concerns pattern)
app.include_router(upload.router)      # POST /upload
app.include_router(baseline.router)    # POST /baseline/run
app.include_router(trustpatch.router)  # POST /trustpatch/evaluate
app.include_router(history.router)     # GET  /history

# ---------------------------------------------------------------------------
# Visitor Counter Endpoint
# ---------------------------------------------------------------------------
@app.get("/api/site-stats", tags=["visitors"])
@app.get("/visitors", tags=["visitors"]) # Keep legacy for compatibility
async def get_visitors():
    """
    Returns the global visitor count using a free external API (counterapi.dev)
    so the count persists even when the Render container restarts.
    Adds 50 to compensate for the lost historical counts.
    """
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.counterapi.dev/v1/trustpatch_app_prod/visitors/up",
                timeout=5.0
            )
            data = response.json()
            # Add 50 to recover the previous visitors that were lost during the reset
            return {"visitors": data.get("count", 0) + 50}
    except Exception as e:
        # Fallback in case the external API is down
        return {"visitors": 51}

# ---------------------------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for Docker container monitoring.
    Returns 200 OK with system status when the backend is running correctly.
    """
    return {
        "status": "healthy",
        "service": "TrustPatch API",
        "version": "1.0.0",
        "endpoints": [
            "POST /upload",
            "POST /baseline/run",
            "POST /trustpatch/evaluate",
            "GET  /history",
            "GET  /history/{session_id}",
            "GET  /docs",
        ]
    }


@app.get("/", tags=["root"])
async def root():
    """Root endpoint — redirects user to API documentation."""
    return {
        "message": "TrustPatch API is running. Visit /docs for API documentation.",
        "docs": "http://localhost:8000/docs",
    }
