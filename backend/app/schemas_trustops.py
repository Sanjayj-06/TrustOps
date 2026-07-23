"""
schemas_trustops.py
-------------------
Pydantic schemas for TrustOps Phase 1 modules:
  - Module 3: Trust Explanation Engine
  - Module 4: Human-in-the-Loop Decision
  - Module 5: Trust Knowledge Base

These define all request/response contracts for the three new routers.
Existing schemas in schemas.py are NOT modified.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


# ===========================================================================
# Module 3 — Trust Explanation Engine Schemas
# ===========================================================================

class ParameterExplanation(BaseModel):
    """
    Structured explanation for a single trust parameter.
    Returned in the 'parameters' list of a PatchExplanation.
    """
    param:            str    # Parameter key: "T", "S", "C", etc.
    label:            str    # Human-readable label: "Test Pass Rate"
    raw_score:        float  # Raw metric score before normalization
    normalized_score: float  # Normalized score [0, 1]
    weight:           float  # Expert-defined weight (e.g. 0.20)
    contribution:     float  # Weighted contribution = score × weight
    status:           str    # "strong" | "moderate" | "weak"
    short_reason:     str    # One-sentence natural-language explanation
    example:          str    # Example or evidence justifying the score


class PatchOverallExplanation(BaseModel):
    """
    Overall trust summary for a single candidate patch.
    Presented at the top of the Explanation Panel.
    """
    summary:         str         # 1-2 sentence overall explanation
    confidence:      str         # "High" | "Medium" | "Low"
    recommendation:  str         # "Accept" | "Review" | "Reject"
    risk_level:      str         # "Low" | "Medium" | "High"
    key_reasons:     List[str]   # 3-5 bullet-point reasons
    key_strengths:   List[str]   # Parameters performing well
    potential_risks: List[str]   # Parameters that are weak / risky


class PatchExplanation(BaseModel):
    """
    Complete structured explanation for one candidate patch.
    Combines per-parameter breakdown with an overall assessment.
    """
    patch_id:   str
    trust_score: float
    rank:        int
    overall:     PatchOverallExplanation
    parameters:  List[ParameterExplanation]


class SessionExplanationResponse(BaseModel):
    """
    Response from GET /trustops/explanation/{session_id}.
    Contains structured explanations for all candidate patches.
    """
    session_id:        str
    selected_patch_id: str        # The patch TrustPatch selected (rank 1)
    baseline_patch_id: str        # The patch BAPR selected
    patches:           List[PatchExplanation]


# ===========================================================================
# Module 4 — Human-in-the-Loop Decision Schemas
# ===========================================================================

# Valid predefined rejection/override reasons (matches architecture diagram)
DECISION_REASONS = [
    "Logic Incorrect",
    "Performance Issue",
    "Security Concern",
    "Readability",
    "Maintainability",
    "Other",
]

VALID_DECISIONS = ["accept", "reject", "override"]


class DecisionRequest(BaseModel):
    """
    Request body for POST /trustops/decision/submit.
    Captures the developer's decision on the trust-selected patch.
    """
    session_id:        str = Field(..., description="Session UUID from /upload")
    patch_id:          str = Field(..., description="Patch ID the decision applies to")
    agreement:         str = Field(..., description="'Yes' | 'No' | 'Partially'")
    decision:          str = Field(..., description="'accept' | 'reject' | 'override'")
    override_patch_id: Optional[str]  = Field(None,  description="If override: the chosen patch ID")
    reason:            Optional[str]  = Field(None,  description="Predefined reason (required for reject/override)")
    comment:           Optional[str]  = Field(None,  description="Optional free-text developer note")


class DecisionResponse(BaseModel):
    """
    Response from POST /trustops/decision/submit.
    Confirms the decision was persisted and saved to the Knowledge Base.
    """
    success:                  bool
    decision_id:              int
    knowledge_base_entry_id:  Optional[int]
    message:                  str


class DecisionRecord(BaseModel):
    """Read model for a stored human decision."""
    id:                int
    session_id:        str
    patch_id:          str
    agreement:         Optional[str]
    decision:          str
    override_patch_id: Optional[str]
    reason:            Optional[str]
    comment:           Optional[str]
    timestamp:         datetime

    class Config:
        from_attributes = True


# ===========================================================================
# Module 5 — Trust Knowledge Base Schemas
# ===========================================================================

class KnowledgeBaseEntrySchema(BaseModel):
    """Read model for a single Knowledge Base entry."""
    id:                   int
    session_id:           str
    bug_filename:         str
    bug_id:               str
    patch_id:             str
    patch_rank:           int
    recommended_patch_id: str
    trust_score:          float
    confidence:           str
    agreement:            Optional[str]
    decision:             Optional[str]
    reason:               Optional[str]
    comment:              Optional[str]
    timestamp:            datetime

    # All 10 trust parameters
    T: float
    S: float
    C: float
    H: float
    A: float
    B: float
    R: float
    X: float
    L: float
    M: float

    class Config:
        from_attributes = True


class KnowledgeSummaryResponse(BaseModel):
    """
    Response from GET /trustops/knowledge/summary.
    Aggregated statistics over all KB entries.
    Designed for extensibility: Phase 2 will add pattern counts and rule engine stats.
    """
    total_entries:                  int
    decisions:                      Dict[str, int]   # {"accept": N, "reject": N, "override": N}
    most_common_rejection_reason:   Optional[str]
    avg_trust_score_accepted:       Optional[float]
    avg_trust_score_rejected:       Optional[float]
    avg_trust_score_overridden:     Optional[float]
    recent_entries:                 List[KnowledgeBaseEntrySchema]
