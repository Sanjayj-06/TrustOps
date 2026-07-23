"""
routers/history.py
-------------------
History Router — provides endpoints to retrieve past evaluation sessions.

Endpoints:
  GET /history
    Returns a paginated list of all past evaluation sessions.
    Each item includes session metadata, selected patches, and trust scores.

  GET /history/{session_id}
    Returns full details for a specific past session, including all 5
    patches, metrics, and chart data reconstructed from the database.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def get_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Retrieve the most recent evaluation sessions (newest first).

    Returns a summary list suitable for display in a history table.
    Each item shows: session_id, filename, timestamp, selected patches.
    """
    # Get all uploads, newest first
    uploads = db.query(models.BugUpload).order_by(
        models.BugUpload.timestamp.desc()
    ).limit(limit).all()

    history = []
    for upload in uploads:
        # Find TAPR-selected patch for this session
        tapr_patch = db.query(models.GeneratedPatch).filter(
            models.GeneratedPatch.session_id == upload.session_id,
            models.GeneratedPatch.selected == True
        ).first()

        # Find BAPR-selected patch
        bapr_patch = db.query(models.GeneratedPatch).filter(
            models.GeneratedPatch.session_id == upload.session_id,
            models.GeneratedPatch.baseline_selected == True
        ).first()

        history.append({
            "session_id":        upload.session_id,
            "filename":          upload.filename,
            "test_filename":     upload.test_filename,
            "timestamp":         upload.timestamp.isoformat() if upload.timestamp else None,
            "baseline_patch":    bapr_patch.patch_id if bapr_patch else "N/A",
            "trustpatch_patch":  tapr_patch.patch_id if tapr_patch else "N/A",
            "trust_score":       tapr_patch.trust_score if tapr_patch else 0.0,
        })

    return {"sessions": history, "total": len(history)}


@router.get("/{session_id}")
async def get_session_detail(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve full details for a specific evaluation session by session_id.

    Returns the same structure as /trustpatch/evaluate but reconstructed
    from the database without re-running any computation.
    """
    upload = db.query(models.BugUpload).filter(
        models.BugUpload.session_id == session_id
    ).first()

    if not upload:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found"
        )

    # Get all patches for this session
    patches = db.query(models.GeneratedPatch).filter(
        models.GeneratedPatch.session_id == session_id
    ).all()

    # Get metrics for each patch
    patch_data = []
    for patch in patches:
        metric = db.query(models.PatchMetric).filter(
            models.PatchMetric.patch_id == patch.patch_id,
            models.PatchMetric.session_id == session_id
        ).first()

        metrics_dict = {}
        if metric:
            for param in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]:
                metrics_dict[param] = getattr(metric, param, 0.0)

        patch_data.append({
            "patch_id":       patch.patch_id,
            "trust_score":    patch.trust_score,
            "baseline_score": patch.baseline_score,
            "selected":       patch.selected,
            "baseline_selected": patch.baseline_selected,
            "metrics":        metrics_dict,
        })

    return {
        "session_id":   session_id,
        "filename":     upload.filename,
        "test_filename": upload.test_filename,
        "timestamp":    upload.timestamp.isoformat() if upload.timestamp else None,
        "patches":      patch_data,
    }
