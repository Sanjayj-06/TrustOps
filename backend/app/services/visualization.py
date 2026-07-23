"""
services/visualization.py
--------------------------
Visualization Service — chart-ready data for frontend Recharts components.

Now includes baselineSelected and isTestGaming flags so the frontend can
visually mark which patch BAPR incorrectly selected vs what TrustPatch
correctly chose.
"""

from typing import List, Dict, Any, Optional

WEIGHTS = {
    "T": 0.20, "S": 0.10, "C": 0.10, "H": 0.10, "A": 0.10,
    "B": 0.10, "R": 0.10, "X": 0.05, "L": 0.10, "M": 0.05,
}

PARAM_LABELS = {
    "T": "Test Pass Rate",    "S": "Semantic Similarity",
    "C": "Complexity",        "H": "Historical",
    "A": "Static Analysis",   "B": "Behavioral",
    "R": "Regression Risk",   "X": "Contextual",
    "L": "LLM Confidence",    "M": "Multi-Patch",
}

TEST_GAMING_INDICATORS = [
    "_KNOWN_AVERAGES", "_KNOWN_AGES", "_OVERRIDE_TABLE", "_COERCE_CACHE",
]


def _is_test_gaming(patch: Dict) -> bool:
    code = patch.get("patch_code", "")
    return any(ind in code for ind in TEST_GAMING_INDICATORS)


def build_chart_data(
    patches: List[Dict],
    baseline_result: Dict,
    trustpatch_result: Dict,
    baseline_patch_id: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "test_success_comparison":  _test_success_chart(baseline_result, trustpatch_result),
        "trust_score_distribution": _trust_score_chart(patches, baseline_patch_id),
        "complexity_comparison":    _metric_chart(patches, "C", "Complexity Score", baseline_patch_id),
        "safety_comparison":        _metric_chart(patches, "A", "Safety Score", baseline_patch_id),
        "behavioral_comparison":    _metric_chart(patches, "B", "Behavioral Consistency", baseline_patch_id),
        "execution_time_comparison": _execution_time_chart(baseline_result, trustpatch_result),
        "weight_distribution":      _weight_distribution(),
        "radar_data":               _radar_data(patches),
        "all_metrics_comparison":   _all_metrics(patches, baseline_patch_id),
    }


def _test_success_chart(baseline: Dict, trustpatch: Dict) -> List[Dict]:
    """
    Chart 1 — test pass rate comparison.
    If BAPR selected the test-gaming patch, its pass rate is higher.
    This is intentional — it shows BAPR's greediness.
    """
    bapr_pct = round(baseline.get("pass_rate", 0.0) * 100, 1)
    tapr_pct = round(trustpatch.get("pass_rate", 0.0) * 100, 1)
    return [
        {
            "approach": "BAPR (Baseline)",
            "passRate": bapr_pct,
            "passed":   baseline.get("passed_tests", 0),
            "total":    baseline.get("total_tests", 0),
            "color":    "#ef4444" if bapr_pct > tapr_pct else "#6366f1",
            "label":    "⚠️ Test-gaming patch" if bapr_pct > tapr_pct else "Correct selection",
        },
        {
            "approach": "TrustPatch (TAPR)",
            "passRate": tapr_pct,
            "passed":   trustpatch.get("passed_tests", 0),
            "total":    trustpatch.get("total_tests", 0),
            "color":    "#10b981",
            "label":    "Genuine fix — correct algorithm",
        },
    ]


def _trust_score_chart(
    patches: List[Dict],
    baseline_patch_id: Optional[str] = None
) -> List[Dict]:
    """
    Chart 2 — trust score per patch.
    Highlights: TAPR selected (teal), BAPR selected (red if test-gaming, indigo otherwise).
    """
    result = []
    for patch in sorted(patches, key=lambda x: x["patch_id"]):
        pid      = patch["patch_id"]
        rank     = patch.get("rank", 99)
        is_tapr  = rank == 1
        is_bapr  = pid == baseline_patch_id
        is_tg    = _is_test_gaming(patch)

        color = "#10b981" if is_tapr else ("#ef4444" if (is_bapr and is_tg) else "#6366f1")

        result.append({
            "patchId":        pid,
            "trustScore":     round(patch.get("trust_score", 0.0), 3),
            "rank":           rank,
            "selected":       is_tapr,
            "baselineSelected": is_bapr,
            "isTestGaming":   is_tg,
            "color":          color,
        })
    return result


def _metric_chart(
    patches: List[Dict],
    metric_key: str,
    label: str,
    baseline_patch_id: Optional[str] = None,
) -> List[Dict]:
    """Generic per-metric chart. Marks BAPR-selected and test-gaming patches."""
    result = []
    for patch in sorted(patches, key=lambda x: x["patch_id"]):
        pid     = patch["patch_id"]
        value   = patch.get("metrics", {}).get(metric_key, 0.0)
        is_tapr = patch.get("rank", 99) == 1
        is_bapr = pid == baseline_patch_id
        is_tg   = _is_test_gaming(patch)
        result.append({
            "patchId":      pid,
            "value":        round(value, 3),
            "label":        label,
            "selected":     is_tapr,
            "baselineSelected": is_bapr,
            "isTestGaming": is_tg,
            "color": "#10b981" if is_tapr else ("#ef4444" if (is_bapr and is_tg) else "#94a3b8"),
        })
    return result


def _execution_time_chart(baseline: Dict, trustpatch: Dict) -> List[Dict]:
    return [
        {
            "approach": "BAPR",
            "time":     round(baseline.get("execution_time", 0.0), 3),
            "color":    "#6366f1",
            "label":    "1 criterion (test pass rate only)",
        },
        {
            "approach": "TrustPatch",
            "time":     round(trustpatch.get("execution_time", 0.0), 3),
            "color":    "#10b981",
            "label":    "10 criteria (comprehensive quality)",
        },
    ]


def _weight_distribution() -> List[Dict]:
    return [
        {
            "parameter": PARAM_LABELS[param],
            "shortName": param,
            "weight":    round(weight * 100, 1),
            "value":     weight,
        }
        for param, weight in WEIGHTS.items()
    ]


def _radar_data(patches: List[Dict]) -> List[Dict]:
    params = ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]
    result = []
    for param in params:
        dp = {
            "parameter": PARAM_LABELS.get(param, param),
            "shortName": param,
        }
        for patch in patches:
            dp[patch["patch_id"]] = round(
                patch.get("metrics", {}).get(param, 0.0), 3
            )
        result.append(dp)
    return result


def _all_metrics(
    patches: List[Dict],
    baseline_patch_id: Optional[str] = None,
) -> List[Dict]:
    """Full metrics table — adds isTestGaming and baselineSelected for UI highlighting."""
    params = ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]
    result = []
    for patch in sorted(patches, key=lambda x: x.get("rank", 99)):
        pid    = patch["patch_id"]
        is_tg  = _is_test_gaming(patch)
        row = {
            "patchId":        pid,
            "trustScore":     round(patch.get("trust_score", 0.0), 3),
            "rank":           patch.get("rank", 99),
            "selected":       patch.get("rank", 99) == 1,
            "baselineScore":  round(patch.get("baseline_score", 0.0), 3),
            "baselineSelected": pid == baseline_patch_id,
            "isTestGaming":   is_tg,
            "strategy":       patch.get("strategy", ""),
        }
        for p in params:
            row[p] = round(patch.get("metrics", {}).get(p, 0.0), 3)
        result.append(row)
    return result
