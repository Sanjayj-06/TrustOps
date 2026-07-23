"""
schemas.py
----------
Pydantic models for request/response validation in FastAPI.

These define the data contracts between the frontend and backend:
  - UploadResponse    : Returned after file upload, includes session_id
  - PatchInfo         : Individual patch details (code + metrics)
  - TrustMetrics      : All 10 trust parameters for a patch
  - BaselineResult    : BAPR pipeline output
  - TrustPatchResult  : TAPR pipeline output (full trust evaluation)
  - EvaluationResponse: Combined BAPR + TAPR results for one session
  - HistoryItem       : Summary record for history list
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class UploadResponse(BaseModel):
    """Response returned after successfully uploading buggy + test files."""
    session_id: str
    filename: str
    test_filename: str
    message: str


class TrustMetrics(BaseModel):
    """
    All 10 normalized trust parameter values for a single patch.
    Each value is in [0.0, 1.0] after normalization.
    """
    T: float  # Test Pass Rate
    S: float  # Semantic Similarity to known fixes
    C: float  # Complexity (inverted — lower cyclomatic = higher score)
    H: float  # Historical Success Rate
    A: float  # Static Analysis Safety
    B: float  # Behavioral Consistency
    R: float  # Regression Risk (inverted — lower failures = higher score)
    X: float  # Contextual Importance weight
    L: float  # LLM Confidence score
    M: float  # Multi-Patch Agreement


class PatchInfo(BaseModel):
    """
    Complete information about one candidate patch.
    Includes source code, trust score, and all individual metrics.
    """
    patch_id: str          # "P1" through "P5"
    patch_code: str        # Modified Python source code
    trust_score: float     # Weighted trust score in [0, 1]
    baseline_score: float  # Raw test pass rate used by BAPR
    rank: int              # TAPR ranking (1 = best)
    metrics: TrustMetrics  # All 10 trust parameters
    explanation: str       # Human-readable explanation string


class BaselineResult(BaseModel):
    """
    Output from the Baseline APR (BAPR) pipeline.
    Selects patch purely based on highest test pass rate.
    """
    selected_patch: str        # Patch ID selected by BAPR
    passed_tests: int          # Number of tests passed
    total_tests: int           # Total number of tests run
    pass_rate: float           # passed_tests / total_tests
    execution_time: float      # Wall-clock time in seconds (perf_counter)
    patch_code: str            # Source code of the selected patch


class TrustPatchResult(BaseModel):
    """
    Output from the TrustPatch (TAPR) pipeline.
    Selects patch based on weighted trust score across 10 parameters.
    """
    selected_patch: str        # Patch ID with highest trust score
    trust_score: float         # Trust score of selected patch
    risk: str                  # "Low" / "Medium" / "High"
    recommendation: str        # "Accept" / "Review" / "Reject"
    explanation: str           # Why this patch was selected
    execution_time: float      # Wall-clock time in seconds
    patch_code: str            # Source code of the selected patch
    top_factors: List[str]     # Top contributing trust factors


class EvaluationResponse(BaseModel):
    """
    Combined response for one full evaluation session.
    Contains both BAPR and TAPR results, plus all 5 ranked patches.
    """
    session_id: str
    patches: List[PatchInfo]       # All 5 patches with full metrics
    baseline: BaselineResult       # BAPR result
    trustpatch: TrustPatchResult   # TAPR result
    weights: dict                  # Expert-defined weights used
    comparison_summary: str        # Text summary comparing the two approaches


class HistoryItem(BaseModel):
    """Summary record used in the /history endpoint listing."""
    session_id: str
    filename: str
    timestamp: datetime
    baseline_patch: str
    trustpatch_patch: str
    trust_score: float

    class Config:
        from_attributes = True
