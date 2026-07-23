"""
routers/decision.py
--------------------
Human-in-the-Loop Decision Router — Module 4.

Endpoints:
  POST /trustops/decision/submit
    Accepts a developer decision (Accept / Reject / Override) with optional
    reason and comment. Persists to human_decisions table and triggers
    a full Knowledge Base snapshot via decision_service.

  GET /trustops/decision/{session_id}
    Returns the most recent human decision for a session.

Architecture position:
  Trust Explanation → Human Review Panel (UI)
    → POST /trustops/decision/submit
    → Decision & Reason → Knowledge Base (Module 5)
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas_trustops import DecisionRequest, DecisionResponse
from app.services import decision_service

router = APIRouter(prefix="/trustops", tags=["trustops-decision"])


@router.post(
    "/decision/submit",
    response_model=DecisionResponse,
    summary="Submit a human decision on a trust-evaluated patch",
    description=(
        "Records the developer's Accept / Reject / Override decision for the "
        "selected patch of an evaluation session. "
        "On Reject or Override, a reason is required. "
        "On Override, the alternative patch ID must be provided. "
        "The decision and a full session snapshot are atomically persisted to "
        "the Trust Knowledge Base."
    ),
)
async def submit_decision(
    request: DecisionRequest,
    db: Session = Depends(get_db),
):
    """
    Submit a human decision for a trust-evaluated patch.

    Body:
      session_id:        UUID of the evaluation session
      patch_id:          Patch the decision is about (e.g. "P1")
      decision:          "accept" | "reject" | "override"
      override_patch_id: Required if decision == "override"
      reason:            Required if decision in ["reject", "override"]
      comment:           Optional free-text note

    Returns:
      success, decision_id, knowledge_base_entry_id, message
    """
    try:
        result = decision_service.submit_decision(
            db                = db,
            session_id        = request.session_id,
            patch_id          = request.patch_id,
            agreement         = request.agreement,
            decision          = request.decision,
            override_patch_id = request.override_patch_id,
            reason            = request.reason,
            comment           = request.comment,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decision submission failed: {str(e)}")

    return DecisionResponse(
        success                 = result["success"],
        decision_id             = result["decision_id"],
        knowledge_base_entry_id = result["knowledge_base_entry_id"],
        message                 = result["message"],
    )


@router.get(
    "/decision/{session_id}",
    summary="Get the human decision for a session",
    description="Returns the most recent human decision recorded for a given session.",
)
async def get_session_decision(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent human decision for a session.
    Returns null decision fields if no decision has been submitted yet.
    """
    decision = decision_service.get_decision_for_session(db, session_id)

    if not decision:
        return {
            "session_id": session_id,
            "decision":   None,
            "message":    "No decision has been submitted for this session yet.",
        }

    return {
        "session_id":        decision.session_id,
        "patch_id":          decision.patch_id,
        "agreement":         decision.agreement,
        "decision":          decision.decision,
        "override_patch_id": decision.override_patch_id,
        "reason":            decision.reason,
        "comment":           decision.comment,
        "timestamp":         decision.timestamp.isoformat() if decision.timestamp else None,
    }
