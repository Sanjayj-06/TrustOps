"""
routers/trustpatch.py
---------------------
TrustPatch Router — implements the full Trust-Aware APR pipeline.

This router runs BOTH pipelines and returns a side-by-side comparison.
The key showcase feature: when BAPR falls for the test-gaming trap (P3),
the response clearly exposes this with diverged=True and bapr_trap_triggered=True.

Endpoints:
  POST /trustpatch/evaluate
    Body: { "session_id": "<uuid>" }
    Returns: Full EvaluationResponse with divergence flags
"""

import time
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models
from app.services.patch_generator import generate_patches
from app.services.testing_service import run_tests_for_all_patches
from app.services.trust_evaluator import evaluate_all_patches, WEIGHTS
from app.services.explainability import generate_explanation
from app.services.visualization import build_chart_data

router = APIRouter(prefix="/trustpatch", tags=["trustpatch"])

TEST_GAMING_INDICATORS = [
    "_KNOWN_AVERAGES", "_KNOWN_AGES", "_OVERRIDE_TABLE",
    "_COERCE_CACHE", "test-gaming", "memoris", "hardcoded",
]


class EvaluateRequest(BaseModel):
    session_id: str


@router.post("/evaluate")
async def evaluate(request: EvaluateRequest, db: Session = Depends(get_db)):
    """
    Run the full TrustPatch (TAPR) pipeline for a given session.

    Both BAPR and TAPR are run, and the response highlights any divergence.
    When BAPR selects the test-gaming patch (P3) and TrustPatch rejects it,
    the response includes:
      diverged: true
      bapr_trap_triggered: true
      bapr_trap_reason: "BAPR selected P3 (a test-gaming patch)..."

    Pipeline Steps:
    1. Retrieve session data from DB
    2. Generate 5 candidate patches (P1–P5, P3 is test-gaming trap)
    3. Run unit tests on each patch
    4. Compute 10 trust parameters, normalize, compute trust scores
    5. Rank patches by trust score
    6. Generate explanation (with divergence/trap detection)
    7. Persist results to DB
    8. Build chart data
    9. Return comprehensive response
    """
    # Step 1: Retrieve session
    upload = db.query(models.BugUpload).filter(
        models.BugUpload.session_id == request.session_id
    ).first()

    if not upload:
        raise HTTPException(
            status_code=404,
            detail=f"Session {request.session_id} not found. Upload files first."
        )

    # ------------------------------------------------------------------
    # TAPR Pipeline
    # ------------------------------------------------------------------
    tapr_start = time.perf_counter()

    patches       = generate_patches(upload.content)
    test_results  = run_tests_for_all_patches(patches, upload.test_content)
    evaluated     = evaluate_all_patches(
        patches=patches,
        test_results=test_results,
        filename=upload.filename or "module.py",
        buggy_code=upload.content,
    )

    tapr_time = round(time.perf_counter() - tapr_start, 4)

    # ------------------------------------------------------------------
    # BAPR Baseline: pick max test pass rate
    # ------------------------------------------------------------------
    bapr_start     = time.perf_counter()
    baseline_best  = max(evaluated, key=lambda p: p["baseline_score"])
    bapr_time      = round(time.perf_counter() - bapr_start, 4)
    bapr_total_time = bapr_time + sum(
        test_results.get(p["patch_id"], {}).get("duration", 0.0)
        for p in patches
    )

    best_tapr       = evaluated[0]  # Rank 1 = highest trust score
    baseline_id     = baseline_best["patch_id"]
    tapr_id         = best_tapr["patch_id"]

    baseline_tr     = test_results.get(baseline_id, {})
    tapr_tr         = test_results.get(tapr_id, {})

    # ------------------------------------------------------------------
    # Divergence flags
    # ------------------------------------------------------------------
    diverged = (tapr_id != baseline_id)
    bapr_code = baseline_best.get("patch_code", "")
    bapr_trap = any(ind in bapr_code for ind in TEST_GAMING_INDICATORS)

    # ------------------------------------------------------------------
    # Generate explanation
    # ------------------------------------------------------------------
    explanation = generate_explanation(
        selected_patch=best_tapr,
        all_patches=evaluated,
        baseline_patch_id=baseline_id,
        baseline_pass_rate=baseline_tr.get("pass_rate", 0.0),
    )

    # ------------------------------------------------------------------
    # Persist to DB
    # ------------------------------------------------------------------
    for ep in evaluated:
        pid             = ep["patch_id"]
        is_tapr_sel     = (ep["rank"] == 1)
        is_bapr_sel     = (pid == baseline_id)
        metrics         = ep.get("metrics", {})

        existing = db.query(models.GeneratedPatch).filter(
            models.GeneratedPatch.session_id == request.session_id,
            models.GeneratedPatch.patch_id == pid
        ).first()

        if existing:
            existing.patch_code        = ep["patch_code"]
            existing.trust_score       = ep["trust_score"]
            existing.baseline_score    = ep["baseline_score"]
            existing.selected          = is_tapr_sel
            existing.baseline_selected = is_bapr_sel
            patch_db_id = existing.id
        else:
            db_patch = models.GeneratedPatch(
                session_id        = request.session_id,
                patch_id          = pid,
                patch_code        = ep["patch_code"],
                trust_score       = ep["trust_score"],
                baseline_score    = ep["baseline_score"],
                selected          = is_tapr_sel,
                baseline_selected = is_bapr_sel,
            )
            db.add(db_patch)
            db.flush()
            patch_db_id = db_patch.id

        existing_metric = db.query(models.PatchMetric).filter(
            models.PatchMetric.session_id == request.session_id,
            models.PatchMetric.patch_id == pid
        ).first()

        if existing_metric:
            for p in ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"]:
                setattr(existing_metric, p, metrics.get(p, 0.0))
        else:
            db.add(models.PatchMetric(
                patch_db_id=patch_db_id,
                session_id=request.session_id,
                patch_id=pid,
                **{p: metrics.get(p, 0.0) for p in ["T","S","C","H","A","B","R","X","L","M"]}
            ))

    db.commit()

    # ------------------------------------------------------------------
    # Build chart data (pass divergence flags for visual highlighting)
    # ------------------------------------------------------------------
    chart_data = build_chart_data(
        patches=evaluated,
        baseline_result={
            "pass_rate":      baseline_tr.get("pass_rate", 0.0),
            "passed_tests":   baseline_tr.get("passed", 0),
            "total_tests":    baseline_tr.get("total", 0),
            "execution_time": round(bapr_total_time, 4),
        },
        trustpatch_result={
            "pass_rate":      tapr_tr.get("pass_rate", 0.0),
            "passed_tests":   tapr_tr.get("passed", 0),
            "total_tests":    tapr_tr.get("total", 0),
            "execution_time": tapr_time,
        },
        baseline_patch_id=baseline_id,
    )

    # ------------------------------------------------------------------
    # Build risk label
    # ------------------------------------------------------------------
    ts = best_tapr["trust_score"]
    if   ts >= 0.70: risk, rec = "Low",    "Accept"
    elif ts >= 0.45: risk, rec = "Medium", "Review"
    else:            risk, rec = "High",   "Reject"

    # ------------------------------------------------------------------
    # Build patch list for response
    # ------------------------------------------------------------------
    patches_response = []
    for ep in sorted(evaluated, key=lambda x: x["rank"]):
        is_tg = any(ind in ep.get("patch_code", "") for ind in TEST_GAMING_INDICATORS)
        patches_response.append({
            "patch_id":       ep["patch_id"],
            "patch_code":     ep["patch_code"],
            "trust_score":    ep["trust_score"],
            "baseline_score": ep["baseline_score"],
            "rank":           ep["rank"],
            "metrics":        ep.get("metrics", {}),
            "strategy":       ep.get("strategy", ""),
            "is_test_gaming": is_tg,
            "explanation": (
                explanation["summary"] if ep["rank"] == 1
                else f"Rank #{ep['rank']} — trust score {ep['trust_score']:.3f}"
            ),
        })

    # ------------------------------------------------------------------
    # Final response
    # ------------------------------------------------------------------
    return {
        "session_id": request.session_id,
        "patches":    patches_response,
        "baseline": {
            "selected_patch":      baseline_id,
            "passed_tests":        baseline_tr.get("passed", 0),
            "total_tests":         baseline_tr.get("total", 0),
            "pass_rate":           round(baseline_tr.get("pass_rate", 0.0), 4),
            "execution_time":      round(bapr_total_time, 4),
            "patch_code":          baseline_best["patch_code"],
            "strategy":            baseline_best.get("strategy", ""),
            "is_test_gaming_patch": bapr_trap,
        },
        "trustpatch": {
            "selected_patch":  tapr_id,
            "trust_score":     best_tapr["trust_score"],
            "risk":            risk,
            "recommendation":  rec,
            "explanation":     explanation["summary"],
            "execution_time":  tapr_time,
            "patch_code":      best_tapr["patch_code"],
            "top_factors":     explanation["top_factors"],
            "pass_rate":       round(tapr_tr.get("pass_rate", 0.0), 4),
            "passed_tests":    tapr_tr.get("passed", 0),
            "total_tests":     tapr_tr.get("total", 0),
            "strategy":        best_tapr.get("strategy", ""),
        },
        "explanation":         explanation,
        "comparison_summary":  explanation.get("comparison", ""),
        "weights":             WEIGHTS,
        "chart_data":          chart_data,
        "diverged":            diverged,
        "bapr_trap_triggered": bapr_trap and diverged,
    }
