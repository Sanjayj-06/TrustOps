"""
routers/explanation.py
-----------------------
Trust Explanation Router — Module 3: Trust Explanation Engine.

Endpoints:
  GET /trustops/explanation/{session_id}
    Returns structured per-parameter explanations for all 5 candidate patches
    of a given session. Reads from the database; does NOT re-run evaluation.

  GET /trustops/explanation/{session_id}/{patch_id}
    Returns the structured explanation for a single patch only.

Architecture position:
  Trust Engine output (DB) → [Parameter Scores & Contributions]
    → GET /trustops/explanation → Explanation Engine → Structured JSON
"""

import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.services.explanation_service import explain_patch, explain_session

router = APIRouter(prefix="/trustops", tags=["trustops-explanation"])


# ---------------------------------------------------------------------------
# Helper: load session patch data from DB
# ---------------------------------------------------------------------------

def _load_session_patches(session_id: str, db: Session) -> dict:
    """
    Load all patch records + metrics for a session from the database.
    Returns a dict with upload info, patches list, selected_id, baseline_id.
    Raises HTTPException(404) if session not found.
    """
    upload = db.query(models.BugUpload).filter(
        models.BugUpload.session_id == session_id
    ).first()
    if not upload:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found. Run /trustpatch/evaluate first."
        )

    patches = db.query(models.GeneratedPatch).filter(
        models.GeneratedPatch.session_id == session_id
    ).all()

    if not patches:
        raise HTTPException(
            status_code=404,
            detail=f"No patches found for session '{session_id}'. Run evaluation first."
        )

    # Determine selected and baseline patch IDs
    selected_id  = next((p.patch_id for p in patches if p.selected), None)
    baseline_id  = next((p.patch_id for p in patches if p.baseline_selected), None)

    # Build patch dicts with metrics
    patch_dicts = []
    for patch in patches:
        metric = db.query(models.PatchMetric).filter(
            models.PatchMetric.session_id == session_id,
            models.PatchMetric.patch_id == patch.patch_id,
        ).first()

        metrics_dict = {}
        if metric:
            for param in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]:
                metrics_dict[param] = getattr(metric, param, 0.0)

        raw_metrics = {}
        if getattr(patch, "raw_metrics_json", None):
            try:
                raw_metrics = json.loads(patch.raw_metrics_json)
            except json.JSONDecodeError:
                pass

        patch_dicts.append({
            "patch_id":    patch.patch_id,
            "trust_score": patch.trust_score,
            "rank":        1 if patch.selected else (2 if not patch.baseline_selected else 3),
            "metrics":     metrics_dict,
            "raw_metrics": raw_metrics,
        })

    # Assign proper ranks by sorting trust scores
    patch_dicts.sort(key=lambda x: x["trust_score"], reverse=True)
    for i, p in enumerate(patch_dicts):
        p["rank"] = i + 1

    return {
        "upload":       upload,
        "patches":      patch_dicts,
        "selected_id":  selected_id or (patch_dicts[0]["patch_id"] if patch_dicts else ""),
        "baseline_id":  baseline_id or "",
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/explanation/{session_id}",
    summary="Get structured trust explanation for all patches in a session",
    description=(
        "Returns per-parameter structured explanations for all candidate patches. "
        "Reads trust scores and metrics from the database. Does NOT re-compute trust. "
        "Call /trustpatch/evaluate first to populate the data."
    ),
)
async def get_session_explanation(
    session_id: str,
    db: Session = Depends(get_db),
):
    """
    Generate and return structured trust explanations for all patches in a session.

    Response includes for each patch:
      - overall: summary, confidence, recommendation, risk_level, key_reasons, strengths, risks
      - parameters: per-param score, weight, contribution, status, short_reason
    """
    data = _load_session_patches(session_id, db)

    explanation = explain_session(
        patches            = data["patches"],
        selected_patch_id  = data["selected_id"],
        baseline_patch_id  = data["baseline_id"],
    )

    return {
        "session_id":        session_id,
        "bug_filename":      data["upload"].filename,
        "selected_patch_id": data["selected_id"],
        "baseline_patch_id": data["baseline_id"],
        "patches":           explanation["patches"],
    }


@router.get(
    "/explanation/{session_id}/{patch_id}",
    summary="Get structured trust explanation for a single patch",
    description=(
        "Returns the full per-parameter explanation for one specific candidate patch. "
        "Useful for the patch selector panel — fetch explanation on demand when a "
        "developer selects a different patch to inspect."
    ),
)
async def get_patch_explanation(
    session_id: str,
    patch_id:   str,
    db: Session = Depends(get_db),
):
    """
    Generate and return the structured trust explanation for a single patch.
    """
    data    = _load_session_patches(session_id, db)
    patches = data["patches"]

    target = next((p for p in patches if p["patch_id"] == patch_id), None)
    if not target:
        raise HTTPException(
            status_code=404,
            detail=f"Patch '{patch_id}' not found in session '{session_id}'."
        )

    explanation = explain_patch(
        patch_id    = target["patch_id"],
        trust_score = target["trust_score"],
        rank        = target["rank"],
        metrics     = target["metrics"],
        raw_metrics = target.get("raw_metrics", {}),
    )

    return {
        "session_id": session_id,
        "explanation": explanation,
    }
