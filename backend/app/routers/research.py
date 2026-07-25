"""
routers/research.py
--------------------
Phase 4 – Research Evaluation Framework: API Router.

All endpoints under /research/* prefix.
Fully additive — no existing routers modified.

Endpoints:
  GET  /research/datasets                    — List all available datasets
  POST /research/datasets/import             — Import bugs from a dataset
  GET  /research/datasets/{name}/bugs        — List bugs in a dataset
  POST /research/datasets/select             — Select bugs for evaluation
  POST /research/experiment/config           — Create experiment configuration
  GET  /research/experiment/{exp_id}         — Get experiment config
  POST /research/experiment/run              — Start experiment pipeline
  GET  /research/experiment/{exp_id}/status  — Poll experiment status
  GET  /research/experiment/{exp_id}/results — Get experiment results
  GET  /research/judge/models                — List available judge models
  POST /research/judge/evaluate              — Manual blind judge evaluation
  GET  /research/metrics/{exp_id}            — Get full metrics for experiment
  GET  /research/dashboard/summary           — Top-card dashboard stats
  GET  /research/export/{exp_id}/csv         — Export as CSV
  GET  /research/export/{exp_id}/json        — Export as JSON
  GET  /research/export/{exp_id}/report      — Export as research tables
"""

import json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app import models_research
from app.schemas_research import (
    DatasetListResponse,
    DatasetBugsResponse,
    ImportRequest,
    ImportResponse,
    SelectBugsRequest,
    ExperimentConfig,
    ExperimentConfigResponse,
    RunExperimentRequest,
    PipelineStatusResponse,
    FullMetricsResponse,
    DashboardSummary,
    JudgeEvaluateRequest,
    JudgeResult,
    JudgeModelsResponse,
    ResearchTableResponse,
    ExperimentResultsResponse,
)
from app.services import dataset_service, llm_judge_service, experiment_pipeline, metrics_collector, report_generator

router = APIRouter(prefix="/research", tags=["Phase 4 – Research Evaluation"])


# =============================================================================
# MODULE 1 — DATASET IMPORT
# =============================================================================

@router.get("/datasets", response_model=dict, summary="List all benchmark datasets")
def list_datasets(db: Session = Depends(get_db)):
    """Return overview of all available benchmark datasets with import status."""
    overview = dataset_service.get_dataset_overview(db)
    return {"datasets": overview}


@router.post("/datasets/import", response_model=dict, summary="Import bugs from a dataset")
def import_dataset(request: ImportRequest, db: Session = Depends(get_db)):
    """Import bugs from a benchmark dataset into the database."""
    try:
        count = dataset_service.import_dataset(db, request.dataset_name, request.bug_ids)
        return {
            "dataset_name": request.dataset_name,
            "imported_count": count,
            "message": f"Successfully imported {count} bugs from {request.dataset_name}",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/datasets/{dataset_name}/bugs", response_model=dict, summary="List bugs in a dataset")
def get_dataset_bugs(dataset_name: str, db: Session = Depends(get_db)):
    """Return all bugs for a dataset (imported or from provider)."""
    bugs = dataset_service.get_dataset_bugs(db, dataset_name)
    return {
        "dataset_name": dataset_name,
        "total": len(bugs),
        "bugs": bugs,
    }


@router.post("/datasets/select", response_model=dict, summary="Select bugs for evaluation")
def select_bugs(request: SelectBugsRequest, db: Session = Depends(get_db)):
    """Mark specific bugs as selected for the next evaluation run."""
    count = dataset_service.select_bugs(db, request.dataset_name, request.bug_ids)
    return {
        "dataset_name": request.dataset_name,
        "selected_count": count,
        "message": f"Selected {count} bugs for evaluation",
    }


@router.get("/datasets/{dataset_name}/bugs/{bug_id}", response_model=dict, summary="Get bug detail")
def get_bug_detail(dataset_name: str, bug_id: str, db: Session = Depends(get_db)):
    """Get full bug details including code."""
    bug = dataset_service.get_bug_detail(db, dataset_name, bug_id)
    if not bug:
        raise HTTPException(status_code=404, detail=f"Bug {bug_id} not found in {dataset_name}")
    return bug


# =============================================================================
# MODULE 2 — EXPERIMENT CONFIGURATION
# =============================================================================

@router.post("/experiment/config", response_model=dict, summary="Create experiment configuration")
def create_experiment_config(config: ExperimentConfig, db: Session = Depends(get_db)):
    """Create a new experiment with the provided configuration."""
    experiment_id = experiment_pipeline.create_experiment(config.dict(), db)
    return {
        "experiment_id": experiment_id,
        "name": config.name,
        "status": "configured",
        "message": f"Experiment {experiment_id} created successfully",
        "config": config.dict(),
    }


@router.get("/experiment/{experiment_id}", response_model=dict, summary="Get experiment configuration")
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    """Get experiment configuration and status."""
    exp = db.query(models_research.ResearchExperiment).filter(
        models_research.ResearchExperiment.experiment_id == experiment_id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {
        "experiment_id": exp.experiment_id,
        "name": exp.name,
        "dataset_name": exp.dataset_name,
        "judge_model": exp.judge_model,
        "evaluation_mode": exp.evaluation_mode,
        "developer_mode": exp.developer_mode,
        "num_candidates": exp.num_candidates,
        "status": exp.status,
        "progress": exp.progress,
        "total_bugs": exp.total_bugs,
        "completed_bugs": exp.completed_bugs,
        "created_at": exp.created_at.isoformat() if exp.created_at else None,
    }


@router.get("/experiments", response_model=dict, summary="List all experiments")
def list_experiments(db: Session = Depends(get_db)):
    """Return a list of all experiments."""
    experiments = db.query(models_research.ResearchExperiment).order_by(
        models_research.ResearchExperiment.created_at.desc()
    ).limit(20).all()
    return {
        "experiments": [
            {
                "experiment_id": e.experiment_id,
                "name": e.name,
                "dataset_name": e.dataset_name,
                "judge_model": e.judge_model,
                "status": e.status,
                "progress": e.progress,
                "total_bugs": e.total_bugs,
                "completed_bugs": e.completed_bugs,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in experiments
        ]
    }


# =============================================================================
# MODULE 4 — AUTOMATED PIPELINE
# =============================================================================

@router.post("/experiment/run", response_model=dict, summary="Start experiment pipeline")
def run_experiment(
    request: RunExperimentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Start the automated evaluation pipeline for an experiment.
    Runs in background — poll /experiment/{id}/status for progress.
    """
    exp = db.query(models_research.ResearchExperiment).filter(
        models_research.ResearchExperiment.experiment_id == request.experiment_id
    ).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    if exp.status == "running":
        return {"message": "Experiment already running", "experiment_id": request.experiment_id, "status": "running"}

    # Update mode if override
    if request.mode:
        exp.evaluation_mode = request.mode
    if request.bug_id:
        exp.selected_bug_ids = request.bug_id
    db.commit()

    # Run synchronously for prototype (in production, use background task with worker)
    # For small datasets (≤10 bugs), synchronous is fine
    result = experiment_pipeline.run_experiment(request.experiment_id, db)

    return {
        "experiment_id": request.experiment_id,
        "status": result.get("status", "completed"),
        "total_bugs": result.get("total_bugs", 0),
        "completed": result.get("completed", 0),
        "message": f"Experiment completed: {result.get('completed', 0)} bugs evaluated",
    }


@router.get("/experiment/{experiment_id}/status", response_model=dict, summary="Poll experiment status")
def get_experiment_status(experiment_id: str, db: Session = Depends(get_db)):
    """Poll the current status and progress of an experiment."""
    status = experiment_pipeline.get_experiment_status(experiment_id, db)
    return status


@router.get("/experiment/{experiment_id}/results", response_model=dict, summary="Get experiment results")
def get_experiment_results(experiment_id: str, db: Session = Depends(get_db)):
    """Get all per-bug results and metrics for a completed experiment."""
    results = db.query(models_research.ResearchResult).filter(
        models_research.ResearchResult.experiment_id == experiment_id
    ).all()

    metrics_row = db.query(models_research.ResearchMetrics).filter(
        models_research.ResearchMetrics.experiment_id == experiment_id
    ).first()

    result_list = []
    for r in results:
        result_list.append({
            "bug_id": r.bug_id,
            "dataset_name": r.dataset_name,
            "baseline_pass_rate": r.baseline_pass_rate,
            "baseline_exec_time": r.baseline_exec_time,
            "baseline_tokens": r.baseline_tokens,
            "trustops_trust_score": r.trustops_trust_score,
            "trustops_exec_time": r.trustops_exec_time,
            "trustops_tokens": r.trustops_tokens,
            "judge_winner": r.judge_winner,
            "judge_confidence": r.judge_confidence,
            "ai_decision": r.ai_decision,
            "status": r.status,
        })

    return {
        "experiment_id": experiment_id,
        "total_bugs": len(results),
        "results": result_list,
        "has_metrics": metrics_row is not None,
    }


# =============================================================================
# MODULE 3 — LLM JUDGE
# =============================================================================

@router.get("/judge/models", response_model=dict, summary="List available judge models")
def list_judge_models():
    """Return all available LLM judge models."""
    return {"models": llm_judge_service.get_available_judges()}


@router.post("/judge/evaluate", response_model=dict, summary="Run blind judge evaluation")
def manual_judge_evaluate(request: JudgeEvaluateRequest, db: Session = Depends(get_db)):
    """
    Manually trigger a blind LLM judge evaluation for two patches.
    Returns structured scores, reasoning, winner, and confidence.
    """
    # Get bug info for context
    bug = None
    for dataset_name in ["Defects4J", "QuixBugs"]:
        bug = dataset_service.get_bug_detail(db, dataset_name, request.bug_id)
        if bug:
            break

    description = bug.get("description", request.bug_id) if bug else request.bug_id
    buggy_code = bug.get("buggy_code", "") if bug else ""
    test_code = bug.get("test_code", "") if bug else ""

    result = llm_judge_service.blind_evaluate(
        bug_id=request.bug_id,
        experiment_id=request.experiment_id,
        bug_description=description,
        buggy_code=buggy_code,
        test_code=test_code,
        baseline_patch=request.baseline_patch,
        trustops_patch=request.trustops_patch,
        judge_model=request.judge_model,
        api_key=request.api_key,
    )

    return result


# =============================================================================
# MODULE 5 — METRICS
# =============================================================================

@router.get("/metrics/{experiment_id}", response_model=dict, summary="Get full metrics for experiment")
def get_metrics(experiment_id: str, db: Session = Depends(get_db)):
    """Return all 7 metric categories for a completed experiment."""
    m = db.query(models_research.ResearchMetrics).filter(
        models_research.ResearchMetrics.experiment_id == experiment_id
    ).first()

    if not m:
        raise HTTPException(status_code=404, detail="Metrics not found. Run the experiment first.")

    trust_dist = {}
    param_contrib = {}
    per_bug = []
    try:
        trust_dist = json.loads(m.trust_distribution_json or '{}')
        param_contrib = json.loads(m.param_contributions_json or '{}')
        per_bug = json.loads(m.per_bug_results_json or '[]')
    except Exception:
        pass

    return {
        "experiment_id": experiment_id,
        "total_bugs": m.total_bugs,
        "patch": {
            "patches_generated": m.patches_generated,
            "patches_selected": m.patches_selected,
            "baseline_top1_accuracy": m.baseline_top1_accuracy,
            "trustops_top1_accuracy": m.trustops_top1_accuracy,
            "baseline_top3_accuracy": m.baseline_top3_accuracy,
            "trustops_top3_accuracy": m.trustops_top3_accuracy,
            "baseline_mrr": m.baseline_mrr,
            "trustops_mrr": m.trustops_mrr,
            "patch_acceptance_rate": m.patch_acceptance_rate,
            "override_rate": m.override_rate,
            "reject_rate": m.reject_rate,
        },
        "trust": {
            "avg_dev_trust": m.avg_dev_trust,
            "avg_runtime_trust": m.avg_runtime_trust,
            "trust_confidence": m.trust_confidence,
            "trust_stability": m.trust_stability,
            "trust_distribution": trust_dist,
            "param_contributions": param_contrib,
        },
        "developer": {
            "dev_acceptance_rate": m.dev_acceptance_rate,
            "dev_override_rate": m.dev_override_rate,
            "dev_agreement_rate": m.dev_agreement_rate,
            "avg_decision_time_s": m.avg_decision_time_s,
            "avg_judge_confidence": m.avg_judge_confidence,
        },
        "runtime": {
            "avg_cpu": m.avg_cpu,
            "avg_memory": m.avg_memory,
            "avg_latency": m.avg_latency,
            "total_exceptions": m.total_exceptions,
            "runtime_failures": m.runtime_failures,
            "avg_runtime_trust_score": m.avg_runtime_trust_score,
            "health_status": m.health_status,
            "mean_time_to_detection": m.mean_time_to_detection,
        },
        "efficiency": {
            "avg_repair_iterations": m.avg_repair_iterations,
            "avg_reprompts": m.avg_reprompts,
            "total_llm_calls": m.total_llm_calls,
            "total_prompt_tokens": m.total_prompt_tokens,
            "total_completion_tokens": m.total_completion_tokens,
            "total_tokens": m.total_tokens,
            "baseline_tokens": m.baseline_tokens,
            "trustops_tokens": m.trustops_tokens,
            "avg_exec_time_s": m.avg_exec_time_s,
        },
        "sustainability": {
            "estimated_energy_kwh": m.estimated_energy_kwh,
            "estimated_carbon_g": m.estimated_carbon_g,
            "estimated_gpu_compute_h": m.estimated_gpu_compute_h,
            "co2_reduction_pct": m.co2_reduction_pct,
        },
        "knowledge": {
            "kb_entries_count": m.kb_entries_count,
            "pattern_count": m.pattern_count,
            "historical_reuse_count": m.historical_reuse_count,
            "adaptation_suggestions": m.adaptation_suggestions,
        },
        "judge_summary": {
            "baseline_wins": m.baseline_wins,
            "trustops_wins": m.trustops_wins,
            "ties": m.ties,
            "avg_judge_score_baseline": m.avg_judge_score_baseline,
            "avg_judge_score_trustops": m.avg_judge_score_trustops,
        },
        "per_bug_results": per_bug,
    }


# =============================================================================
# MODULE 6 — DASHBOARD
# =============================================================================

@router.get("/dashboard/summary", response_model=dict, summary="Get dashboard summary stats")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Return aggregated top-card statistics across all experiments."""
    return report_generator.get_dashboard_summary(db)


# =============================================================================
# MODULE 7 — EXPORT
# =============================================================================

@router.get("/export/{experiment_id}/csv", summary="Export results as CSV")
def export_csv(experiment_id: str, db: Session = Depends(get_db)):
    """Download full experiment results as CSV."""
    csv_content = report_generator.generate_csv(experiment_id, db)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=trustops_experiment_{experiment_id}.csv"},
    )


@router.get("/export/{experiment_id}/json", response_model=dict, summary="Export results as JSON")
def export_json(experiment_id: str, db: Session = Depends(get_db)):
    """Return complete structured results as JSON."""
    return report_generator.generate_json(experiment_id, db)


@router.get("/export/{experiment_id}/report", response_model=dict, summary="Generate research tables")
def export_research_report(experiment_id: str, db: Session = Depends(get_db)):
    """
    Generate publication-ready comparison tables for ISEC 2027 paper.
    Returns Markdown, LaTeX, and structured row data.
    """
    result = report_generator.generate_research_tables(experiment_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
