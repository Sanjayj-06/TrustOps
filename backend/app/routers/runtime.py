"""
routers/runtime.py
------------------
Runtime Trust Router — Module 6.

Endpoints for managing and querying runtime trust monitoring.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas_runtime import (
    RuntimeStartRequest,
    RuntimeSimulateRequest,
    RuntimeMetricsResponse,
    RuntimeHistoryResponse,
    RuntimeHealthResponse
)
from app.services import runtime_monitor

router = APIRouter(prefix="/trustops/runtime", tags=["trustops-runtime"])


@router.post("/start", summary="Start a runtime monitoring session")
def start_runtime_session(request: RuntimeStartRequest, db: Session = Depends(get_db)):
    """Initializes runtime tracking for a deployed patch."""
    session = runtime_monitor.start_runtime_session(db, request.session_id, request.patch_id)
    return {"message": f"Runtime session started for {request.session_id} on patch {request.patch_id}"}


@router.post("/simulate", summary="Simulate next runtime tick")
def simulate_runtime_tick(request: RuntimeSimulateRequest, db: Session = Depends(get_db)):
    """Pushes simulated telemetry and generates an event for demonstration purposes."""
    try:
        event = runtime_monitor.simulate_metrics(db, request.session_id)
        return {"message": "Simulated tick complete", "event_id": event.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{session_id}", response_model=RuntimeMetricsResponse, summary="Get latest runtime metrics")
def get_runtime_metrics(session_id: str, db: Session = Depends(get_db)):
    metrics = runtime_monitor.get_latest_metrics(db, session_id)
    if not metrics:
        # Return zeros if no metrics yet
        return RuntimeMetricsResponse(
            cpu_usage=0.0, memory_usage=0.0, peak_memory=0.0, latency=0.0,
            exceptions=0, app_errors=0, test_failures=0, security_alerts=0,
            executions=0, success_rate=1.0, timestamp=None
        )
    return RuntimeMetricsResponse(**metrics)


@router.get("/history/{session_id}", response_model=RuntimeHistoryResponse, summary="Get timeline of runtime events")
def get_runtime_history(session_id: str, db: Session = Depends(get_db)):
    events = runtime_monitor.get_event_history(db, session_id)
    return RuntimeHistoryResponse(session_id=session_id, events=events)


@router.get("/health/{session_id}", response_model=RuntimeHealthResponse, summary="Get current runtime health & trust")
def get_runtime_health(session_id: str, db: Session = Depends(get_db)):
    events = runtime_monitor.get_event_history(db, session_id)
    if not events:
        raise HTTPException(status_code=404, detail=f"No runtime history for session '{session_id}'.")
    
    latest = events[-1]
    return RuntimeHealthResponse(
        session_id=session_id,
        health_status=latest["health_status"],
        runtime_trust=latest["runtime_trust"],
        reason=latest["reason"]
    )
