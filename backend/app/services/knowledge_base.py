"""
services/knowledge_base.py
--------------------------
Knowledge Base Service — Module 5: Trust Knowledge Base (Storage Layer).

Provides CRUD operations for knowledge_base_entries.
Designed for extensibility: Phase 2 will add a Rule Engine and Pattern Learner
that reads from this store and updates trust weights.

Current responsibility (Phase 1):
  - Save a full session snapshot when a human decision is submitted
  - Retrieve entries and summary statistics
  - Update an entry's human decision fields after a decision is made

Architecture position:
  Human Decision (Module 4) → [Decision & Reason] → Knowledge Base (Module 5)
  Knowledge Base (Module 5) → [Learning Loop] → Trust Engine (Module 2) [Phase 2+]
"""

import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app import models


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

def save_entry(
    db:               Session,
    session_id:       str,
    bug_filename:     str,
    bug_id:           str,
    patch_id:         str,
    patch_rank:       int,
    recommended_patch_id: str,
    patch_code:       str,
    trust_score:      float,
    confidence:       str,
    metrics:          Dict[str, float],
    weights:          Dict[str, float],
    parameter_contributions: Dict[str, float],
    explanation:      Dict,
    agreement:        Optional[str] = None,
    decision:         Optional[str] = None,
    reason:           Optional[str] = None,
    comment:          Optional[str] = None,
) -> models.KnowledgeBaseEntry:
    """
    Persist a complete session snapshot to the Knowledge Base.

    Called by decision_service when a human submits a decision.
    Creates a new KB entry regardless of whether one exists,
    so the full history of decisions for a session is preserved.

    Args:
        db:            Database session
        session_id:    Source evaluation session UUID
        bug_filename:  Original buggy file name
        patch_id:      Patch the human decision applies to
        patch_code:    Full patch source code
        trust_score:   Trust score at decision time
        metrics:       All 10 normalized trust parameter values
        weights:       Weight vector at decision time (for historical record)
        explanation:   Full structured explanation dict
        decision:      Human decision: "accept" | "reject" | "override"
        reason:        Predefined reason string (for reject/override)
        comment:       Optional free-text developer note

    Returns:
        Newly created KnowledgeBaseEntry ORM object
    """
    param_keys = ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]

    entry = models.KnowledgeBaseEntry(
        session_id       = session_id,
        bug_filename     = bug_filename,
        bug_id           = bug_id,
        patch_id         = patch_id,
        patch_rank       = patch_rank,
        recommended_patch_id = recommended_patch_id,
        patch_code       = patch_code,
        trust_score      = trust_score,
        confidence       = confidence,
        weights_json     = json.dumps(weights),
        parameter_contributions_json = json.dumps(parameter_contributions),
        explanation_json = json.dumps(explanation),
        agreement        = agreement,
        decision         = decision,
        reason           = reason,
        comment          = comment,
        **{k: metrics.get(k, 0.0) for k in param_keys},
    )

    db.add(entry)
    db.flush()   # Populate .id before commit
    return entry


# ---------------------------------------------------------------------------
# Read operations
# ---------------------------------------------------------------------------

def get_all_entries(db: Session, limit: int = 100) -> List[models.KnowledgeBaseEntry]:
    """Return all Knowledge Base entries, newest first."""
    return (
        db.query(models.KnowledgeBaseEntry)
        .order_by(models.KnowledgeBaseEntry.timestamp.desc())
        .limit(limit)
        .all()
    )


def get_entry_by_id(db: Session, entry_id: int) -> Optional[models.KnowledgeBaseEntry]:
    """Retrieve a single KB entry by its primary key."""
    return db.query(models.KnowledgeBaseEntry).filter(
        models.KnowledgeBaseEntry.id == entry_id
    ).first()


def get_entries_by_session(db: Session, session_id: str) -> List[models.KnowledgeBaseEntry]:
    """Retrieve all KB entries for a specific session."""
    return db.query(models.KnowledgeBaseEntry).filter(
        models.KnowledgeBaseEntry.session_id == session_id
    ).all()


# ---------------------------------------------------------------------------
# Summary statistics
# ---------------------------------------------------------------------------

def get_summary(db: Session) -> Dict[str, Any]:
    """
    Compute aggregate statistics across all Knowledge Base entries.
    Returns a dict matching KnowledgeSummaryResponse schema.

    Extensibility note: Phase 2 will extend this to include pattern counts
    and Rule Engine output (most effective repair patterns per bug type).
    """
    entries = db.query(models.KnowledgeBaseEntry).all()

    total = len(entries)

    # Decision distribution
    decisions: Dict[str, int] = {"accept": 0, "reject": 0, "override": 0}
    reason_counts: Dict[str, int] = {}

    accepted_scores:  List[float] = []
    rejected_scores:  List[float] = []
    overridden_scores: List[float] = []

    for entry in entries:
        dec = entry.decision
        if dec in decisions:
            decisions[dec] += 1

        if dec in ("reject", "override") and entry.reason:
            reason_counts[entry.reason] = reason_counts.get(entry.reason, 0) + 1

        if dec == "accept":
            accepted_scores.append(entry.trust_score)
        elif dec == "reject":
            rejected_scores.append(entry.trust_score)
        elif dec == "override":
            overridden_scores.append(entry.trust_score)

    # Most common rejection/override reason
    most_common_reason = (
        max(reason_counts, key=reason_counts.get)
        if reason_counts else None
    )

    def _avg(scores: List[float]) -> Optional[float]:
        return round(sum(scores) / len(scores), 4) if scores else None

    # Get recent entries for the frontend preview
    recent_entries = (
        db.query(models.KnowledgeBaseEntry)
        .order_by(models.KnowledgeBaseEntry.timestamp.desc())
        .limit(5)
        .all()
    )

    return {
        "total_entries":                total,
        "decisions":                    decisions,
        "most_common_rejection_reason": most_common_reason,
        "avg_trust_score_accepted":     _avg(accepted_scores),
        "avg_trust_score_rejected":     _avg(rejected_scores),
        "avg_trust_score_overridden":   _avg(overridden_scores),
        "recent_entries":               recent_entries,
    }
