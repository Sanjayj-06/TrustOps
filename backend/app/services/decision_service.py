"""
services/decision_service.py
------------------------------
Decision Service — Module 4: Human-in-the-Loop Decision.

Business logic for submitting and retrieving human decisions.
On every decision submission, this service:
  1. Validates the decision payload
  2. Persists the decision to human_decisions table
  3. Reads the session's patch data from the DB
  4. Calls knowledge_base.save_entry() to persist the full KB snapshot

Architecture position:
  Human Review Panel (UI) → POST /trustops/decision/submit
    → DecisionService → HumanDecision (DB) + KnowledgeBaseEntry (DB)
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app import models
from app.schemas_trustops import VALID_DECISIONS, DECISION_REASONS
from app.services import knowledge_base as kb_service
from app.services.explanation_service import explain_patch, _classify_confidence
import json


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _validate_decision(
    decision: str,
    reason: Optional[str],
    override_patch_id: Optional[str],
) -> None:
    """
    Validate the incoming decision request.
    Raises ValueError with a descriptive message on failure.
    """
    if decision not in VALID_DECISIONS:
        raise ValueError(
            f"Invalid decision '{decision}'. Must be one of: {VALID_DECISIONS}"
        )
    if decision in ("reject", "override") and not reason:
        raise ValueError(
            f"A reason is required when decision is '{decision}'. "
            f"Valid reasons: {DECISION_REASONS}"
        )
    if decision == "override" and not override_patch_id:
        raise ValueError(
            "An override_patch_id is required when decision is 'override'."
        )
    if reason and reason not in DECISION_REASONS:
        raise ValueError(
            f"Invalid reason '{reason}'. Must be one of: {DECISION_REASONS}"
        )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def submit_decision(
    db:                Session,
    session_id:        str,
    patch_id:          str,
    agreement:         str,
    decision:          str,
    override_patch_id: Optional[str],
    reason:            Optional[str],
    comment:           Optional[str],
) -> Dict[str, Any]:
    """
    Submit and persist a human decision for a session's patch.

    Steps:
      1. Validate inputs
      2. Save to human_decisions table
      3. Retrieve session data (upload + patch + metrics)
      4. Build structured explanation for the KB snapshot
      5. Save full snapshot to knowledge_base_entries
      6. Commit transaction

    Returns dict with decision_id, knowledge_base_entry_id, and status.
    """
    # --- Step 1: Validate ---
    _validate_decision(decision, reason, override_patch_id)

    # --- Step 2: Retrieve upload record for this session ---
    upload = db.query(models.BugUpload).filter(
        models.BugUpload.session_id == session_id
    ).first()
    if not upload:
        raise ValueError(f"Session '{session_id}' not found.")

    # --- Step 3: Retrieve the decided patch ---
    patch_record = db.query(models.GeneratedPatch).filter(
        models.GeneratedPatch.session_id == session_id,
        models.GeneratedPatch.patch_id == patch_id,
    ).first()
    if not patch_record:
        raise ValueError(
            f"Patch '{patch_id}' not found in session '{session_id}'."
        )

    # --- Step 4: Retrieve patch metrics ---
    metric_record = db.query(models.PatchMetric).filter(
        models.PatchMetric.session_id == session_id,
        models.PatchMetric.patch_id == patch_id,
    ).first()

    metrics: Dict[str, float] = {}
    if metric_record:
        for param in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]:
            metrics[param] = getattr(metric_record, param, 0.0)

    # --- Step 5: Compute weights (fixed expert weights for Phase 1) ---
    weights = {
        "T": 0.20, "S": 0.10, "C": 0.10, "H": 0.10, "A": 0.10,
        "B": 0.10, "R": 0.10, "X": 0.05, "L": 0.10, "M": 0.05,
    }
    parameter_contributions = {k: metrics.get(k, 0.0) * weights.get(k, 0.0) for k in weights}

    # --- Step 6: Build structured explanation for KB snapshot ---
    raw_metrics = {}
    if getattr(patch_record, "raw_metrics_json", None):
        try:
            raw_metrics = json.loads(patch_record.raw_metrics_json)
        except json.JSONDecodeError:
            pass

    rank = 1 if patch_record.selected else 99
    explanation = explain_patch(
        patch_id    = patch_id,
        trust_score = patch_record.trust_score,
        rank        = rank,
        metrics     = metrics,
        raw_metrics = raw_metrics,
    )

    confidence = _classify_confidence(patch_record.trust_score)

    # Find the recommended patch (the one TAPR selected)
    recommended_patch = db.query(models.GeneratedPatch).filter(
        models.GeneratedPatch.session_id == session_id,
        models.GeneratedPatch.selected == True
    ).first()
    recommended_patch_id = recommended_patch.patch_id if recommended_patch else patch_id

    # --- Step 7: Save human decision to DB ---
    human_decision = models.HumanDecision(
        session_id        = session_id,
        patch_id          = patch_id,
        agreement         = agreement,
        decision          = decision,
        override_patch_id = override_patch_id,
        reason            = reason,
        comment           = comment,
    )
    db.add(human_decision)
    db.flush()   # Get the ID before KB entry creation

    # --- Step 8: Persist Knowledge Base entry ---
    kb_entry = kb_service.save_entry(
        db            = db,
        session_id    = session_id,
        bug_filename  = upload.filename or "unknown.py",
        bug_id        = upload.filename or "unknown.py",
        patch_id      = patch_id,
        patch_rank    = rank,
        recommended_patch_id = recommended_patch_id,
        patch_code    = patch_record.patch_code or "",
        trust_score   = patch_record.trust_score,
        confidence    = confidence,
        metrics       = metrics,
        weights       = weights,
        parameter_contributions = parameter_contributions,
        explanation   = explanation,
        agreement     = agreement,
        decision      = decision,
        reason        = reason,
        comment       = comment,
    )

    # --- Step 9: Commit everything atomically ---
    db.commit()

    return {
        "success":                  True,
        "decision_id":              human_decision.id,
        "knowledge_base_entry_id":  kb_entry.id,
        "message": (
            f"Decision '{decision}' for patch {patch_id} recorded successfully. "
            f"Snapshot saved to Knowledge Base (entry #{kb_entry.id})."
        ),
    }


def get_decision_for_session(db: Session, session_id: str) -> Optional[models.HumanDecision]:
    """Retrieve the most recent human decision for a session."""
    return (
        db.query(models.HumanDecision)
        .filter(models.HumanDecision.session_id == session_id)
        .order_by(models.HumanDecision.timestamp.desc())
        .first()
    )
