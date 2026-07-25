"""
schemas_research.py
-------------------
Phase 4 – Research Evaluation Framework: Pydantic Schemas.

Defines all request/response contracts for the /research/* API endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# =============================================================================
# MODULE 1 — DATASET IMPORT
# =============================================================================

class DatasetBugInfo(BaseModel):
    """Single bug entry in a benchmark dataset."""
    bug_id: str
    dataset_name: str
    language: str
    description: str
    imported: bool = False
    selected: bool = False
    status: str = "pending"


class DatasetInfo(BaseModel):
    """Overview of one benchmark dataset."""
    name: str
    language: str
    num_bugs: int
    imported_bugs: int
    selected_bugs: int
    description: str
    status: str  # "available" | "partial" | "imported"


class DatasetListResponse(BaseModel):
    datasets: List[DatasetInfo]


class DatasetBugsResponse(BaseModel):
    dataset_name: str
    total: int
    bugs: List[DatasetBugInfo]


class ImportRequest(BaseModel):
    dataset_name: str
    bug_ids: Optional[List[str]] = None  # None = import all


class ImportResponse(BaseModel):
    dataset_name: str
    imported_count: int
    message: str


class SelectBugsRequest(BaseModel):
    dataset_name: str
    bug_ids: List[str]


# =============================================================================
# MODULE 2 — EXPERIMENT CONFIGURATION
# =============================================================================

class ExperimentConfig(BaseModel):
    """Experiment configuration payload."""
    name: Optional[str] = "Research Experiment"
    dataset_name: str = "Defects4J"
    num_candidates: int = Field(default=5, ge=1, le=10)
    judge_model: str = "synthetic"     # "gpt-4o" | "claude-3-5-sonnet" | "gemini-1.5-pro" | "synthetic"
    judge_api_key: Optional[str] = None
    evaluation_mode: str = "full"      # "single" | "batch" | "full"
    developer_mode: str = "ai"         # "human" | "ai"
    selected_bug_ids: Optional[List[str]] = None
    single_bug_id: Optional[str] = None


class ExperimentConfigResponse(BaseModel):
    experiment_id: str
    name: str
    status: str
    message: str
    config: ExperimentConfig


# =============================================================================
# MODULE 3 — LLM JUDGE
# =============================================================================

class JudgeCriteriaScores(BaseModel):
    """Scores (1-10) for each evaluation criterion."""
    functional_correctness: float
    maintainability: float
    readability: float
    security: float
    behavior_preservation: float
    logical_consistency: float
    overall_quality: float


class JudgeResult(BaseModel):
    """Output from the blind LLM judge for one bug."""
    bug_id: str
    experiment_id: str
    judge_model: str
    patch_a_scores: JudgeCriteriaScores
    patch_b_scores: JudgeCriteriaScores
    winner: str                  # "baseline" | "trustops" | "tie"
    judge_reasoning: str
    confidence: float            # 0.0 – 1.0
    raw_response: Optional[Dict[str, Any]] = None


class JudgeEvaluateRequest(BaseModel):
    experiment_id: str
    bug_id: str
    baseline_patch: str
    trustops_patch: str
    judge_model: str = "synthetic"
    api_key: Optional[str] = None


class JudgeModelInfo(BaseModel):
    model_id: str
    display_name: str
    provider: str
    requires_api_key: bool
    available: bool


class JudgeModelsResponse(BaseModel):
    models: List[JudgeModelInfo]


# =============================================================================
# MODULE 4 — PIPELINE
# =============================================================================

class RunExperimentRequest(BaseModel):
    experiment_id: str
    mode: str = "full"      # "single" | "batch" | "full"
    bug_id: Optional[str] = None   # For single mode


class PipelineStatusResponse(BaseModel):
    experiment_id: str
    status: str             # "configured" | "running" | "completed" | "failed"
    progress: float         # 0.0 – 1.0
    total_bugs: int
    completed_bugs: int
    current_bug: Optional[str] = None
    log_messages: List[str] = []
    message: str


# =============================================================================
# MODULE 5 — METRICS
# =============================================================================

class PatchMetricSnapshot(BaseModel):
    patches_generated: int
    patches_selected: int
    baseline_top1_accuracy: float
    trustops_top1_accuracy: float
    baseline_top3_accuracy: float
    trustops_top3_accuracy: float
    baseline_mrr: float
    trustops_mrr: float
    patch_acceptance_rate: float
    override_rate: float
    reject_rate: float


class TrustMetricSnapshot(BaseModel):
    avg_dev_trust: float
    avg_runtime_trust: float
    trust_confidence: float
    trust_stability: float
    trust_distribution: Dict[str, float]
    param_contributions: Dict[str, float]


class DeveloperMetricSnapshot(BaseModel):
    dev_acceptance_rate: float
    dev_override_rate: float
    dev_agreement_rate: float
    avg_decision_time_s: float
    avg_judge_confidence: float


class RuntimeMetricSnapshot(BaseModel):
    avg_cpu: float
    avg_memory: float
    avg_latency: float
    total_exceptions: int
    runtime_failures: int
    avg_runtime_trust_score: float
    health_status: str
    mean_time_to_detection: float


class EfficiencyMetricSnapshot(BaseModel):
    avg_repair_iterations: float
    avg_reprompts: float
    total_llm_calls: int
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    baseline_tokens: int
    trustops_tokens: int
    avg_exec_time_s: float


class SustainabilityMetricSnapshot(BaseModel):
    estimated_energy_kwh: float
    estimated_carbon_g: float
    estimated_gpu_compute_h: float
    co2_reduction_pct: float


class KnowledgeMetricSnapshot(BaseModel):
    kb_entries_count: int
    pattern_count: int
    historical_reuse_count: int
    adaptation_suggestions: int


class FullMetricsResponse(BaseModel):
    experiment_id: str
    total_bugs: int
    patch: PatchMetricSnapshot
    trust: TrustMetricSnapshot
    developer: DeveloperMetricSnapshot
    runtime: RuntimeMetricSnapshot
    efficiency: EfficiencyMetricSnapshot
    sustainability: SustainabilityMetricSnapshot
    knowledge: KnowledgeMetricSnapshot
    judge_summary: Dict[str, Any]
    per_bug_results: List[Dict[str, Any]]


# =============================================================================
# MODULE 6 — DASHBOARD
# =============================================================================

class DashboardSummary(BaseModel):
    total_experiments: int
    total_bugs_evaluated: int
    baseline_wins: int
    trustops_wins: int
    ties: int
    avg_trust: float
    avg_runtime_trust: float
    avg_carbon_reduction: float
    avg_token_reduction: float
    avg_acceptance_rate: float
    latest_experiment_id: Optional[str] = None


# =============================================================================
# MODULE 7 — EXPORT
# =============================================================================

class ExportRequest(BaseModel):
    experiment_id: str
    format: str  # "csv" | "json" | "report"


class ResearchTableRow(BaseModel):
    """One row in the ISEC publication table."""
    metric: str
    baseline: str
    trustops: str
    improvement: str
    significance: str


class ResearchTableResponse(BaseModel):
    experiment_id: str
    table_title: str
    rows: List[ResearchTableRow]
    latex_source: str
    markdown_source: str


# =============================================================================
# RESULT SCHEMAS
# =============================================================================

class PerBugResult(BaseModel):
    bug_id: str
    dataset_name: str
    baseline_pass_rate: float
    baseline_exec_time: float
    baseline_tokens: int
    trustops_trust_score: float
    trustops_exec_time: float
    trustops_tokens: int
    judge_winner: Optional[str]
    judge_confidence: Optional[float]
    ai_decision: Optional[str]
    status: str


class ExperimentResultsResponse(BaseModel):
    experiment_id: str
    status: str
    total_bugs: int
    results: List[PerBugResult]
    metrics: Optional[FullMetricsResponse] = None
