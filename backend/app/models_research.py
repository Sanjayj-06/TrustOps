"""
models_research.py
------------------
Phase 4 – Research Evaluation Framework: SQLAlchemy ORM Models.

New Tables (fully additive — zero changes to existing models):
  - ResearchDataset     : Imported benchmark bug registry (Defects4J, QuixBugs, ...)
  - ResearchExperiment  : Stored experiment configuration per run
  - ResearchResult      : Per-bug Baseline vs TrustOps outcome with judge verdict
  - JudgeEvaluation     : Blind LLM judge scores for one bug evaluation
  - ResearchMetrics     : Aggregated metric snapshot for an entire experiment
"""

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class ResearchDataset(Base):
    """
    ResearchDatasets table.
    Registry of benchmark bugs imported from Defects4J, QuixBugs, or future datasets.
    One row per individual bug (not per dataset).
    """
    __tablename__ = "research_datasets"

    id              = Column(Integer, primary_key=True, index=True)
    dataset_name    = Column(String, index=True)       # "Defects4J" | "QuixBugs" | ...
    bug_id          = Column(String, index=True)       # e.g. "Lang-1", "find_first_in_sorted"
    language        = Column(String, default="Python")  # "Java" | "Python"
    description     = Column(Text, nullable=True)      # Short description of the bug
    buggy_code      = Column(Text, nullable=True)      # Buggy source code
    test_code       = Column(Text, nullable=True)      # Test file source code
    reference_fix   = Column(Text, nullable=True)      # Ground-truth developer fix
    imported        = Column(Boolean, default=False)   # True once imported into system
    selected        = Column(Boolean, default=False)   # True if user selected for evaluation
    status          = Column(String, default="pending")  # "pending" | "running" | "completed" | "failed"
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class ResearchExperiment(Base):
    """
    ResearchExperiments table.
    Stores the configuration and state for one research evaluation run.
    """
    __tablename__ = "research_experiments"

    id                  = Column(Integer, primary_key=True, index=True)
    experiment_id       = Column(String, unique=True, index=True)  # UUID
    name                = Column(String, nullable=True)
    dataset_name        = Column(String, nullable=True)           # Which dataset
    num_candidates      = Column(Integer, default=5)              # Patches per bug
    judge_model         = Column(String, default="synthetic")     # "gpt-4o" | "claude-3-5-sonnet" | "gemini-1.5-pro" | "synthetic"
    judge_api_key       = Column(Text, nullable=True)             # Encrypted/plain for prototype
    evaluation_mode     = Column(String, default="full")          # "single" | "batch" | "full"
    developer_mode      = Column(String, default="human")         # "human" | "ai"
    selected_bug_ids    = Column(Text, nullable=True)             # JSON list of selected bug IDs
    status              = Column(String, default="configured")    # "configured" | "running" | "completed" | "failed"
    progress            = Column(Float, default=0.0)              # 0.0 – 1.0
    total_bugs          = Column(Integer, default=0)
    completed_bugs      = Column(Integer, default=0)
    config_json         = Column(Text, nullable=True)             # Full config as JSON
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())


class ResearchResult(Base):
    """
    ResearchResults table.
    One row per bug evaluated in an experiment.
    Stores Baseline APR and TrustOps outputs side by side.
    """
    __tablename__ = "research_results"

    id                      = Column(Integer, primary_key=True, index=True)
    experiment_id           = Column(String, index=True)   # FK to ResearchExperiment.experiment_id
    bug_id                  = Column(String, index=True)   # FK to ResearchDataset.bug_id
    dataset_name            = Column(String)

    # --- Baseline APR ---
    baseline_patch_id       = Column(String, nullable=True)
    baseline_patch_code     = Column(Text, nullable=True)
    baseline_pass_rate      = Column(Float, default=0.0)
    baseline_exec_time      = Column(Float, default=0.0)   # seconds
    baseline_tokens         = Column(Integer, default=0)
    baseline_iterations     = Column(Integer, default=1)

    # --- TrustOps ---
    trustops_patch_id       = Column(String, nullable=True)
    trustops_patch_code     = Column(Text, nullable=True)
    trustops_trust_score    = Column(Float, default=0.0)
    trustops_exec_time      = Column(Float, default=0.0)   # seconds
    trustops_tokens         = Column(Integer, default=0)
    trustops_iterations     = Column(Integer, default=1)
    trustops_metrics_json   = Column(Text, nullable=True)  # Full 10-D trust metrics

    # --- Judge Verdict ---
    judge_winner            = Column(String, nullable=True)   # "baseline" | "trustops" | "tie"
    judge_confidence        = Column(Float, nullable=True)    # 0.0 – 1.0
    judge_model_used        = Column(String, nullable=True)
    judge_eval_id           = Column(Integer, nullable=True)  # FK to JudgeEvaluation.id

    # --- AI Human Mode ---
    ai_decision             = Column(String, nullable=True)   # "accept" | "reject" | "override"
    ai_decision_reason      = Column(Text, nullable=True)
    ai_decision_confidence  = Column(Float, nullable=True)
    ai_decision_model       = Column(String, nullable=True)

    # --- Status ---
    status                  = Column(String, default="pending")   # "pending" | "completed" | "failed"
    error_message           = Column(Text, nullable=True)
    created_at              = Column(DateTime(timezone=True), server_default=func.now())


class JudgeEvaluation(Base):
    """
    JudgeEvaluations table.
    Stores the full blind LLM judge output for one bug.
    Patch A / B labels are randomized — ground truth stored separately.
    """
    __tablename__ = "judge_evaluations"

    id                      = Column(Integer, primary_key=True, index=True)
    experiment_id           = Column(String, index=True)
    bug_id                  = Column(String, index=True)
    judge_model             = Column(String)                  # Model used

    # Blind evaluation (A/B labels — which is baseline/trustops hidden during eval)
    patch_a_label           = Column(String)                  # "baseline" | "trustops" (revealed after)
    patch_b_label           = Column(String)

    # Per-criterion scores (1-10) for each patch
    patch_a_functional      = Column(Float, default=0.0)
    patch_a_maintainability = Column(Float, default=0.0)
    patch_a_readability     = Column(Float, default=0.0)
    patch_a_security        = Column(Float, default=0.0)
    patch_a_behavior        = Column(Float, default=0.0)
    patch_a_logic           = Column(Float, default=0.0)
    patch_a_overall         = Column(Float, default=0.0)

    patch_b_functional      = Column(Float, default=0.0)
    patch_b_maintainability = Column(Float, default=0.0)
    patch_b_readability     = Column(Float, default=0.0)
    patch_b_security        = Column(Float, default=0.0)
    patch_b_behavior        = Column(Float, default=0.0)
    patch_b_logic           = Column(Float, default=0.0)
    patch_b_overall         = Column(Float, default=0.0)

    # Winner and reasoning
    judge_winner_label      = Column(String, nullable=True)   # "A" | "B" | "tie"
    judge_winner_system     = Column(String, nullable=True)   # "baseline" | "trustops" | "tie"
    judge_reasoning         = Column(Text, nullable=True)
    judge_confidence        = Column(Float, default=0.0)      # 0.0 – 1.0

    raw_response_json       = Column(Text, nullable=True)     # Full raw JSON from judge
    created_at              = Column(DateTime(timezone=True), server_default=func.now())


class ResearchMetrics(Base):
    """
    ResearchMetrics table.
    Aggregated metric snapshot for an entire experiment (all bugs combined).
    Covers all 7 metric categories from the specification.
    """
    __tablename__ = "research_metrics"

    id              = Column(Integer, primary_key=True, index=True)
    experiment_id   = Column(String, unique=True, index=True)

    # ---- Patch Metrics ----
    total_bugs              = Column(Integer, default=0)
    patches_generated       = Column(Integer, default=0)
    patches_selected        = Column(Integer, default=0)
    baseline_top1_accuracy  = Column(Float, default=0.0)   # %
    trustops_top1_accuracy  = Column(Float, default=0.0)   # %
    baseline_top3_accuracy  = Column(Float, default=0.0)   # %
    trustops_top3_accuracy  = Column(Float, default=0.0)   # %
    baseline_mrr            = Column(Float, default=0.0)
    trustops_mrr            = Column(Float, default=0.0)
    patch_acceptance_rate   = Column(Float, default=0.0)   # %
    override_rate           = Column(Float, default=0.0)   # %
    reject_rate             = Column(Float, default=0.0)   # %

    # ---- Trust Metrics ----
    avg_dev_trust           = Column(Float, default=0.0)
    avg_runtime_trust       = Column(Float, default=0.0)
    trust_confidence        = Column(Float, default=0.0)
    trust_stability         = Column(Float, default=0.0)
    trust_distribution_json = Column(Text, nullable=True)  # JSON histogram
    param_contributions_json= Column(Text, nullable=True)  # JSON per-param averages

    # ---- Developer Metrics ----
    dev_acceptance_rate     = Column(Float, default=0.0)
    dev_override_rate       = Column(Float, default=0.0)
    dev_agreement_rate      = Column(Float, default=0.0)
    avg_decision_time_s     = Column(Float, default=0.0)
    avg_judge_confidence    = Column(Float, default=0.0)

    # ---- Runtime Metrics ----
    avg_cpu                 = Column(Float, default=0.0)
    avg_memory              = Column(Float, default=0.0)
    avg_latency             = Column(Float, default=0.0)
    total_exceptions        = Column(Integer, default=0)
    runtime_failures        = Column(Integer, default=0)
    avg_runtime_trust_score = Column(Float, default=0.0)
    health_status           = Column(String, nullable=True)
    mean_time_to_detection  = Column(Float, default=0.0)   # seconds

    # ---- Efficiency Metrics ----
    avg_repair_iterations   = Column(Float, default=0.0)
    avg_reprompts           = Column(Float, default=0.0)
    total_llm_calls         = Column(Integer, default=0)
    total_prompt_tokens     = Column(Integer, default=0)
    total_completion_tokens = Column(Integer, default=0)
    total_tokens            = Column(Integer, default=0)
    baseline_tokens         = Column(Integer, default=0)
    trustops_tokens         = Column(Integer, default=0)
    avg_exec_time_s         = Column(Float, default=0.0)

    # ---- Sustainability Metrics ----
    estimated_energy_kwh    = Column(Float, default=0.0)
    estimated_carbon_g      = Column(Float, default=0.0)
    estimated_gpu_compute_h = Column(Float, default=0.0)
    co2_reduction_pct       = Column(Float, default=0.0)   # % reduction vs baseline

    # ---- Knowledge Metrics ----
    kb_entries_count        = Column(Integer, default=0)
    pattern_count           = Column(Integer, default=0)
    historical_reuse_count  = Column(Integer, default=0)
    adaptation_suggestions  = Column(Integer, default=0)

    # ---- Judge Summary ----
    baseline_wins           = Column(Integer, default=0)
    trustops_wins           = Column(Integer, default=0)
    ties                    = Column(Integer, default=0)
    avg_judge_score_baseline= Column(Float, default=0.0)
    avg_judge_score_trustops= Column(Float, default=0.0)

    # ---- Per-bug results as JSON (for charts) ----
    per_bug_results_json    = Column(Text, nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())
