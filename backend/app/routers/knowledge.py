"""
routers/knowledge.py
----------------------
Trust Knowledge Base Router — Module 5 (Read-only in Phase 1).

Endpoints:
  GET /trustops/knowledge/summary
    Aggregated statistics: total entries, decision distribution,
    most common rejection reasons, average trust scores per decision type.

  GET /trustops/knowledge/entries
    List all Knowledge Base entries (paginated).

  GET /trustops/knowledge/entries/{entry_id}
    Full detail for a specific KB entry including full explanation JSON.

Architecture position:
  Knowledge Base (DB) → Rule Engine / Pattern Learner [Phase 2+]
  Knowledge Base (DB) → Read endpoints (this router)
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.schemas_trustops import KnowledgeSummaryResponse
from app.services import knowledge_base as kb_service

router = APIRouter(prefix="/trustops", tags=["trustops-knowledge"])


@router.get(
    "/knowledge/summary",
    response_model=KnowledgeSummaryResponse,
    summary="Get Trust Knowledge Base summary statistics",
    description=(
        "Returns aggregated statistics over all entries in the Trust Knowledge Base. "
        "Includes total entries, decision distribution, most common rejection reasons, "
        "and average trust scores per decision category."
    ),
)
async def get_knowledge_summary(db: Session = Depends(get_db)):
    """
    Retrieve aggregate statistics from the Knowledge Base.

    Returns:
      total_entries:                Total number of KB snapshots stored
      decisions:                    Count per decision type {"accept": N, "reject": N, "override": N}
      most_common_rejection_reason: The most frequent rejection/override reason
      avg_trust_score_accepted:     Mean trust score of accepted patches
      avg_trust_score_rejected:     Mean trust score of rejected patches
      avg_trust_score_overridden:   Mean trust score of overridden patches
    """
    summary = kb_service.get_summary(db)
    return KnowledgeSummaryResponse(**summary)


@router.get(
    "/knowledge/entries",
    summary="List all Trust Knowledge Base entries",
    description="Returns a paginated list of all stored KB entries (newest first).",
)
async def list_knowledge_entries(
    limit: int = Query(50, ge=1, le=200, description="Max entries to return"),
    db: Session = Depends(get_db),
):
    """
    List Knowledge Base entries, newest first.
    Each entry includes session metadata, patch ID, trust score, and decision.
    Use /entries/{entry_id} for full details including the explanation JSON.
    """
    entries = kb_service.get_all_entries(db, limit=limit)

    return {
        "total": len(entries),
        "entries": [
            {
                "id":           e.id,
                "session_id":   e.session_id,
                "bug_filename": e.bug_filename,
                "patch_id":     e.patch_id,
                "trust_score":  e.trust_score,
                "decision":     e.decision,
                "reason":       e.reason,
                "timestamp":    e.timestamp.isoformat() if e.timestamp else None,
                # Include all 10 trust parameters for quick reference
                "metrics": {
                    p: getattr(e, p, 0.0)
                    for p in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]
                },
            }
            for e in entries
        ],
    }


@router.get(
    "/knowledge/entries/{entry_id}",
    summary="Get full detail of a single Knowledge Base entry",
    description=(
        "Returns all fields including the full structured explanation JSON "
        "and the weight vector stored at decision time."
    ),
)
async def get_knowledge_entry(
    entry_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve full detail for a single Knowledge Base entry.
    """
    entry = kb_service.get_entry_by_id(db, entry_id)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"Knowledge Base entry #{entry_id} not found."
        )

    # Parse stored JSON fields safely
    weights_parsed     = json.loads(entry.weights_json)     if entry.weights_json     else {}
    explanation_parsed = json.loads(entry.explanation_json) if entry.explanation_json else {}

    return {
        "id":              entry.id,
        "session_id":      entry.session_id,
        "bug_filename":    entry.bug_filename,
        "patch_id":        entry.patch_id,
        "patch_code":      entry.patch_code,
        "trust_score":     entry.trust_score,
        "decision":        entry.decision,
        "reason":          entry.reason,
        "comment":         entry.comment,
        "timestamp":       entry.timestamp.isoformat() if entry.timestamp else None,
        "weights":         weights_parsed,
        "explanation":     explanation_parsed,
        "metrics": {
            p: getattr(entry, p, 0.0)
            for p in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]
        },
    }
