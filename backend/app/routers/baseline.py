"""
routers/baseline.py
--------------------
Baseline APR Router — implements the traditional automated program repair pipeline.

BAPR Pipeline:
  Buggy Code → Generate Patches → Run Tests → Select Highest Pass Rate → Return Result

This is the baseline system we compare TrustPatch against.
BAPR only uses test pass rate as its selection criterion — it has no
awareness of complexity, semantic similarity, security, or other quality dimensions.

Endpoint:
  POST /baseline/run
    Body: { "session_id": "<uuid>" }
    Returns: BaselineResult with selected patch and metrics
"""

import time
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas
from app.services.patch_generator import generate_patches
from app.services.testing_service import run_tests_for_all_patches

router = APIRouter(prefix="/baseline", tags=["baseline"])


class RunRequest(BaseModel):
    """Request body for the BAPR run endpoint."""
    session_id: str


@router.post("/run", response_model=schemas.BaselineResult)
async def run_baseline(request: RunRequest, db: Session = Depends(get_db)):
    """
    Run the Baseline APR pipeline for a given session.

    Pipeline Steps:
    1. Retrieve uploaded buggy code and test file from DB
    2. Generate 5 candidate patches (P1–P5)
    3. Run unit tests against each patch
    4. Select the patch with the highest test pass rate
    5. Store results in DB and return

    If multiple patches tie on pass rate, the first one (P1) wins —
    demonstrating a key limitation of BAPR: no secondary quality criteria.
    """
    # Step 1: Retrieve uploaded files
    upload = db.query(models.BugUpload).filter(
        models.BugUpload.session_id == request.session_id
    ).first()

    if not upload:
        raise HTTPException(
            status_code=404,
            detail=f"Session {request.session_id} not found. Upload files first."
        )

    # Measure BAPR total execution time using high-resolution counter
    pipeline_start = time.perf_counter()

    # Step 2: Generate 5 candidate patches
    patches = generate_patches(upload.content)

    # Step 3: Run unit tests against each patch
    test_results = run_tests_for_all_patches(patches, upload.test_content)

    # Step 4: Select patch with highest test pass rate (BAPR criterion)
    best_patch = max(patches, key=lambda p: test_results[p["patch_id"]]["pass_rate"])
    best_result = test_results[best_patch["patch_id"]]

    pipeline_end = time.perf_counter()
    execution_time = pipeline_end - pipeline_start

    # Step 5: Persist patches to DB (upsert — don't duplicate if re-running)
    for patch in patches:
        pid = patch["patch_id"]
        tr = test_results[pid]
        is_selected = (pid == best_patch["patch_id"])

        # Check if patch already exists for this session
        existing = db.query(models.GeneratedPatch).filter(
            models.GeneratedPatch.session_id == request.session_id,
            models.GeneratedPatch.patch_id == pid
        ).first()

        if existing:
            existing.patch_code = patch["patch_code"]
            existing.baseline_score = tr["pass_rate"]
            existing.baseline_selected = is_selected
        else:
            db_patch = models.GeneratedPatch(
                session_id        = request.session_id,
                patch_id          = pid,
                patch_code        = patch["patch_code"],
                baseline_score    = tr["pass_rate"],
                baseline_selected = is_selected,
            )
            db.add(db_patch)

    db.commit()

    # Build and return the BAPR result
    return schemas.BaselineResult(
        selected_patch  = best_patch["patch_id"],
        passed_tests    = best_result["passed"],
        total_tests     = best_result["total"],
        pass_rate       = round(best_result["pass_rate"], 4),
        execution_time  = round(execution_time, 4),
        patch_code      = best_patch["patch_code"],
    )
