"""
services/explanation_service.py
---------------------------------
Trust Explanation Service — Module 3: Trust Explanation Engine.

Generates structured, per-parameter natural-language explanations for
each candidate patch based on the trust scores and metrics already
computed by the Trust Engine.

IMPORTANT: This service is purely a consumer of trust results.
It does NOT re-compute or modify trust scores.
It does NOT call trust_evaluator.py.

Architecture position:
  Trust Engine (Module 2) → [Parameter Scores & Contributions] → Explanation Engine (Module 3)

Output structure per patch:
  - overall:    summary, confidence, recommendation, risk, key_reasons, key_strengths, potential_risks
  - parameters: [{param, label, raw_score, normalized_score, weight, contribution, status, short_reason, example}, ...]
"""

from typing import List, Dict, Any


# ---------------------------------------------------------------------------
# Constants shared across explanation logic
# ---------------------------------------------------------------------------

PARAM_LABELS: Dict[str, str] = {
    "T": "Test Pass Rate",
    "S": "Semantic Similarity",
    "C": "Code Complexity",
    "H": "Historical Success",
    "A": "Static Analysis",
    "B": "Behavioral Consistency",
    "R": "Regression Risk",
    "X": "Contextual Importance",
    "L": "LLM Confidence",
    "M": "Multi-Patch Agreement",
}

WEIGHTS: Dict[str, float] = {
    "T": 0.20, "S": 0.10, "C": 0.10, "H": 0.10, "A": 0.10,
    "B": 0.10, "R": 0.10, "X": 0.05, "L": 0.10, "M": 0.05,
}

# Status thresholds (on [0,1] normalized scale)
STRONG_THRESHOLD   = 0.65
MODERATE_THRESHOLD = 0.35


# ---------------------------------------------------------------------------
# Short reason generators per parameter
# Returns (short_reason, example)
# ---------------------------------------------------------------------------

def _explain_T(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Strong functional correctness confirmed by test suite.", 
                f"Patch passed {round(raw * 100)}% of regression and unit tests.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Partial functional coverage.", 
                f"Patch passed {round(raw * 100)}% of tests, failing edge cases.")
    return ("Significant functional gaps detected.", 
            f"Only {round(raw * 100)}% test pass rate.")


def _explain_S(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Highly aligned with established repair patterns.", 
                f"Token overlap with verified patches is {round(raw * 100)}%.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Moderate semantic alignment with known fixes.", 
                f"Token overlap is {round(raw * 100)}%.")
    return ("Unconventional or anti-pattern repair approach.", 
            f"Token overlap is only {round(raw * 100)}%.")


def _explain_C(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Minimal complexity added.", 
                "Cyclomatic complexity remains low, preventing technical debt.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Moderate code complexity.", 
                "Introduces some branching but remains maintainable.")
    return ("Excessive cyclomatic complexity.", 
            "Introduces deeply nested structures or hardcoded tables.")


def _explain_H(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Historically proven pattern.", 
                f"Similar structural fixes succeeded {round(raw * 100)}% of the time historically.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Pattern with mixed historical success.", 
                f"Historical success rate for this pattern is {round(raw * 100)}%.")
    return ("Pattern with poor historical track record.", 
            f"Historical success rate is only {round(raw * 100)}%.")


def _explain_A(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Clean static analysis.", 
                f"Pylint and AST checks yielded a score of {round(raw * 100)}%.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Minor static analysis warnings.", 
                f"Pylint score is {round(raw * 100)}%, indicating minor style issues.")
    return ("Critical static analysis violations.", 
            f"Score of {round(raw * 100)}% due to magic numbers, unused code, or unsafe eval.")


def _explain_B(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Behaviorally consistent across inputs.", 
                f"Matches intended output on {round(raw * 100)}% of held-out fuzzing inputs.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Partial behavioral consistency.", 
                f"Matches intended output on {round(raw * 100)}% of held-out inputs.")
    return ("Critical behavioral inconsistency (overfitting).", 
            f"Fails on {100 - round(raw * 100)}% of unseen inputs, indicating test-gaming.")


def _explain_R(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Minimal regression risk.", 
                f"Patch preserves {round(raw * 100)}% of existing unharmed functionality.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Moderate regression risk.", 
                f"Preserves {round(raw * 100)}% of unharmed functionality; some side-effects.")
    return ("High regression risk.", 
            f"Breaks {100 - round(raw * 100)}% of previously working features.")


def _explain_X(raw: float, norm: float) -> tuple[str, str]:
    if raw >= 0.85:
        return ("Applied to a mission-critical module.", "Target module handles Security/Auth/Payments.")
    elif raw >= 0.6:
        return ("Applied to a standard module.", "Target module is part of the core API.")
    return ("Applied to a utility module.", "Target module has low business criticality.")


def _explain_L(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("High LLM architectural confidence.", 
                "Model verifies the fix aligns with best practices and context.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Moderate LLM confidence.", 
                "Model flags alternative implementations might exist.")
    return ("Low LLM confidence (Anti-pattern).", 
            "Model explicitly flags hardcoded or unsafe code structures.")


def _explain_M(raw: float, norm: float) -> tuple[str, str]:
    if norm >= STRONG_THRESHOLD:
        return ("Strong multi-patch consensus.", 
                f"Averages {round(raw * 100)}% similarity with other candidate patches.")
    elif norm >= MODERATE_THRESHOLD:
        return ("Moderate multi-patch consensus.", 
                f"Averages {round(raw * 100)}% similarity with alternatives.")
    return ("Low multi-patch consensus.", 
            f"Isolated approach with only {round(raw * 100)}% similarity to others.")


EXPLAINERS = {
    "T": _explain_T, "S": _explain_S, "C": _explain_C, "H": _explain_H, "A": _explain_A,
    "B": _explain_B, "R": _explain_R, "X": _explain_X, "L": _explain_L, "M": _explain_M,
}


# ---------------------------------------------------------------------------
# Status classification
# ---------------------------------------------------------------------------

def _classify_status(score: float) -> str:
    """Map a normalized [0,1] score to a status label."""
    if score >= STRONG_THRESHOLD:
        return "strong"
    elif score >= MODERATE_THRESHOLD:
        return "moderate"
    else:
        return "weak"


def _classify_confidence(trust_score: float) -> str:
    if trust_score >= 0.70:
        return "High"
    elif trust_score >= 0.45:
        return "Medium"
    else:
        return "Low"


def _classify_recommendation(trust_score: float) -> str:
    if trust_score >= 0.70:
        return "Accept"
    elif trust_score >= 0.45:
        return "Review"
    else:
        return "Reject"


def _classify_risk(trust_score: float) -> str:
    if trust_score >= 0.70:
        return "Low"
    elif trust_score >= 0.45:
        return "Medium"
    else:
        return "High"


# ---------------------------------------------------------------------------
# Per-parameter breakdown builder
# ---------------------------------------------------------------------------

def _build_parameter_explanations(metrics: Dict[str, float], raw_metrics: Dict[str, float]) -> List[Dict]:
    """
    Build the full list of parameter-level explanations.
    Each entry contains: param, label, raw_score, normalized_score, weight, contribution, status, short_reason, example.
    """
    params = ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]
    result = []
    for param in params:
        norm_score = round(metrics.get(param, 0.0), 4)
        raw_score  = round(raw_metrics.get(param, 0.0), 4)
        weight = WEIGHTS[param]
        contribution = round(norm_score * weight, 4)
        status = _classify_status(norm_score)
        
        explainer = EXPLAINERS.get(param)
        if explainer:
            short_reason, example = explainer(raw_score, norm_score)
        else:
            short_reason, example = "Score evaluated.", f"Score is {raw_score}."

        result.append({
            "param":            param,
            "label":            PARAM_LABELS[param],
            "raw_score":        raw_score,
            "normalized_score": norm_score,
            "weight":           weight,
            "contribution":     contribution,
            "status":           status,
            "short_reason":     short_reason,
            "example":          example,
        })
    return result


# ---------------------------------------------------------------------------
# Overall explanation builder
# ---------------------------------------------------------------------------

def _build_overall_explanation(
    patch_id: str,
    trust_score: float,
    rank: int,
    param_explanations: List[Dict],
) -> Dict:
    """
    Build the overall trust summary for a patch.
    Produces: summary, confidence, recommendation, risk_level, key_reasons, key_strengths, potential_risks.
    """
    confidence     = _classify_confidence(trust_score)
    recommendation = _classify_recommendation(trust_score)
    risk_level     = _classify_risk(trust_score)

    key_strengths = [
        f"{pe['label']}: {round(pe['raw_score'] * 100, 1)}% (Raw)"
        for pe in param_explanations if pe["status"] == "strong"
    ]
    potential_risks = [
        f"{pe['label']}: {pe['short_reason']}"
        for pe in param_explanations if pe["status"] == "weak"
    ]

    # Top contributing parameters by weighted contribution
    top_params = sorted(param_explanations, key=lambda x: x["contribution"], reverse=True)[:4]
    key_reasons = [pe["short_reason"] for pe in top_params]

    # Contextual prefix based on rank
    if rank == 1:
        prefix = f"Patch {patch_id} was selected by TrustPatch with a trust score of {trust_score:.3f}."
    else:
        prefix = f"Patch {patch_id} ranked #{rank} with a trust score of {trust_score:.3f}."

    if recommendation == "Accept":
        qualifier = "It meets the quality threshold across most trust dimensions."
    elif recommendation == "Review":
        qualifier = "It meets partial quality criteria but warrants human review."
    else:
        qualifier = "It falls below the quality threshold and is not recommended for deployment."

    summary = f"{prefix} {qualifier}"

    return {
        "summary":         summary,
        "confidence":      confidence,
        "recommendation":  recommendation,
        "risk_level":      risk_level,
        "key_reasons":     key_reasons,
        "key_strengths":   key_strengths if key_strengths else ["No parameters reached the strong threshold."],
        "potential_risks": potential_risks if potential_risks else ["No critical risks identified."],
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def explain_patch(
    patch_id:    str,
    trust_score: float,
    rank:        int,
    metrics:     Dict[str, float],
    raw_metrics: Dict[str, float],
) -> Dict:
    """
    Generate a complete structured explanation for a single patch.

    Args:
        patch_id:    Patch identifier ("P1"–"P5")
        trust_score: Computed trust score [0,1]
        rank:        Rank position (1 = best)
        metrics:     Normalized 10-parameter dict from trust_evaluator
        raw_metrics: Raw metrics dict from trust_evaluator

    Returns:
        Dict with keys: patch_id, trust_score, rank, overall, parameters
    """
    param_explanations = _build_parameter_explanations(metrics, raw_metrics)
    overall = _build_overall_explanation(
        patch_id, trust_score, rank, param_explanations
    )
    return {
        "patch_id":    patch_id,
        "trust_score": trust_score,
        "rank":        rank,
        "overall":     overall,
        "parameters":  param_explanations,
    }


def explain_session(
    patches:          List[Dict],
    selected_patch_id: str,
    baseline_patch_id: str,
) -> Dict:
    """
    Generate structured explanations for all patches in a session.

    Args:
        patches:           List of evaluated patch dicts (must include raw_metrics and metrics)
        selected_patch_id: Patch ID chosen by TrustPatch (rank 1)
        baseline_patch_id: Patch ID chosen by BAPR

    Returns:
        Dict with keys: selected_patch_id, baseline_patch_id, patches (list of explanations)
    """
    patch_explanations = []
    for p in patches:
        metrics = p.get("metrics", {})
        raw_metrics = p.get("raw_metrics", {})
        
        # Fallback if raw metrics or normalized metrics are missing
        if not metrics:
            metrics = {k: p.get(k, 0.0) for k in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]}
        if not raw_metrics:
            raw_metrics = {k: 0.0 for k in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]}

        explanation = explain_patch(
            patch_id    = p["patch_id"],
            trust_score = p.get("trust_score", 0.0),
            rank        = p.get("rank", 99),
            metrics     = metrics,
            raw_metrics = raw_metrics,
        )
        patch_explanations.append(explanation)

    # Sort by rank for a clean ordered response
    patch_explanations.sort(key=lambda x: x["rank"])

    return {
        "session_id": patches[0].get("session_id", "unknown") if patches else "unknown",
        "selected_patch_id": selected_patch_id,
        "baseline_patch_id": baseline_patch_id,
        "patches":           patch_explanations,
    }
