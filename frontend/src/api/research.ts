/**
 * api/research.ts
 * ----------------
 * Phase 4 – Research Evaluation Framework: API client.
 *
 * All calls target /research/* endpoints.
 * Uses the same axios instance from trustpatch.ts (base URL is inherited).
 */

import api from "./trustpatch";

// =============================================================================
// TYPES
// =============================================================================

export interface DatasetInfo {
  name: string;
  language: string;
  num_bugs: number;
  imported_bugs: number;
  selected_bugs: number;
  description: string;
  status: string;
}

export interface BugInfo {
  bug_id: string;
  dataset_name: string;
  language: string;
  description: string;
  imported: boolean;
  selected: boolean;
  status: string;
}

export interface ExperimentConfig {
  name?: string;
  dataset_name: string;
  num_candidates: number;
  judge_model: string;
  judge_api_key?: string;
  evaluation_mode: string;
  developer_mode: string;
  selected_bug_ids?: string[];
  single_bug_id?: string;
}

export interface ExperimentSummary {
  experiment_id: string;
  name: string;
  dataset_name: string;
  judge_model: string;
  status: string;
  progress: number;
  total_bugs: number;
  completed_bugs: number;
  created_at: string | null;
}

export interface PipelineStatus {
  experiment_id: string;
  status: string;
  progress: number;
  total_bugs: number;
  completed_bugs: number;
  current_bug?: string;
  log_messages: string[];
  message: string;
}

export interface JudgeModel {
  model_id: string;
  display_name: string;
  provider: string;
  requires_api_key: boolean;
  available: boolean;
}

export interface JudgeCriteriaScores {
  functional_correctness: number;
  maintainability: number;
  readability: number;
  security: number;
  behavior_preservation: number;
  logical_consistency: number;
  overall_quality: number;
}

export interface JudgeEvaluationResult {
  bug_id: string;
  experiment_id: string;
  judge_model: string;
  patch_a_scores: JudgeCriteriaScores;
  patch_b_scores: JudgeCriteriaScores;
  baseline_scores: JudgeCriteriaScores;
  trustops_scores: JudgeCriteriaScores;
  judge_winner_label: string;
  judge_winner_system: string;
  confidence: number;
  reasoning: string;
}

export interface FullMetrics {
  experiment_id: string;
  total_bugs: number;
  patch: {
    patches_generated: number;
    patches_selected: number;
    baseline_top1_accuracy: number;
    trustops_top1_accuracy: number;
    baseline_top3_accuracy: number;
    trustops_top3_accuracy: number;
    baseline_mrr: number;
    trustops_mrr: number;
    patch_acceptance_rate: number;
    override_rate: number;
    reject_rate: number;
  };
  trust: {
    avg_dev_trust: number;
    avg_runtime_trust: number;
    trust_confidence: number;
    trust_stability: number;
    trust_distribution: Record<string, number>;
    param_contributions: Record<string, number>;
  };
  developer: {
    dev_acceptance_rate: number;
    dev_override_rate: number;
    dev_agreement_rate: number;
    avg_decision_time_s: number;
    avg_judge_confidence: number;
  };
  runtime: {
    avg_cpu: number;
    avg_memory: number;
    avg_latency: number;
    total_exceptions: number;
    runtime_failures: number;
    avg_runtime_trust_score: number;
    health_status: string;
    mean_time_to_detection: number;
  };
  efficiency: {
    avg_repair_iterations: number;
    avg_reprompts: number;
    total_llm_calls: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    baseline_tokens: number;
    trustops_tokens: number;
    avg_exec_time_s: number;
  };
  sustainability: {
    estimated_energy_kwh: number;
    estimated_carbon_g: number;
    estimated_gpu_compute_h: number;
    co2_reduction_pct: number;
  };
  knowledge: {
    kb_entries_count: number;
    pattern_count: number;
    historical_reuse_count: number;
    adaptation_suggestions: number;
  };
  judge_summary: {
    baseline_wins: number;
    trustops_wins: number;
    ties: number;
    avg_judge_score_baseline: number;
    avg_judge_score_trustops: number;
  };
  per_bug_results: any[];
}

export interface DashboardSummary {
  total_experiments: number;
  total_bugs_evaluated: number;
  baseline_wins: number;
  trustops_wins: number;
  ties: number;
  avg_trust: number;
  avg_runtime_trust: number;
  avg_carbon_reduction: number;
  avg_token_reduction: number;
  avg_acceptance_rate: number;
  latest_experiment_id: string | null;
}

export interface ResearchTableRow {
  metric: string;
  baseline: string;
  trustops: string;
  improvement: string;
  significance: string;
}

export interface ResearchReport {
  experiment_id: string;
  table_title: string;
  rows: ResearchTableRow[];
  markdown_source: string;
  latex_source: string;
}

// =============================================================================
// MODULE 1 — DATASET API
// =============================================================================

export const getDatasets = async (): Promise<{ datasets: DatasetInfo[] }> => {
  const resp = await api.get("/research/datasets");
  return resp.data;
};

export const importDataset = async (
  dataset_name: string,
  bug_ids?: string[]
): Promise<{ imported_count: number; message: string }> => {
  const resp = await api.post("/research/datasets/import", { dataset_name, bug_ids });
  return resp.data;
};

export const getDatasetBugs = async (
  dataset_name: string
): Promise<{ dataset_name: string; total: number; bugs: BugInfo[] }> => {
  const resp = await api.get(`/research/datasets/${dataset_name}/bugs`);
  return resp.data;
};

export const selectBugs = async (
  dataset_name: string,
  bug_ids: string[]
): Promise<{ selected_count: number; message: string }> => {
  const resp = await api.post("/research/datasets/select", { dataset_name, bug_ids });
  return resp.data;
};

export const getBugDetail = async (
  dataset_name: string,
  bug_id: string
): Promise<any> => {
  const resp = await api.get(`/research/datasets/${dataset_name}/bugs/${bug_id}`);
  return resp.data;
};

// =============================================================================
// MODULE 2 — EXPERIMENT CONFIGURATION API
// =============================================================================

export const createExperiment = async (
  config: ExperimentConfig
): Promise<{ experiment_id: string; status: string; message: string }> => {
  const resp = await api.post("/research/experiment/config", config);
  return resp.data;
};

export const getExperiment = async (
  experiment_id: string
): Promise<ExperimentSummary> => {
  const resp = await api.get(`/research/experiment/${experiment_id}`);
  return resp.data;
};

export const listExperiments = async (): Promise<{ experiments: ExperimentSummary[] }> => {
  const resp = await api.get("/research/experiments");
  return resp.data;
};

// =============================================================================
// MODULE 3 — LLM JUDGE API
// =============================================================================

export const getJudgeModels = async (): Promise<{ models: JudgeModel[] }> => {
  const resp = await api.get("/research/judge/models");
  return resp.data;
};

export const runJudgeEvaluation = async (params: {
  experiment_id: string;
  bug_id: string;
  baseline_patch: string;
  trustops_patch: string;
  judge_model: string;
  api_key?: string;
}): Promise<JudgeEvaluationResult> => {
  const resp = await api.post("/research/judge/evaluate", params);
  return resp.data;
};

// =============================================================================
// MODULE 4 — PIPELINE API
// =============================================================================

export const runExperiment = async (params: {
  experiment_id: string;
  mode?: string;
  bug_id?: string;
}): Promise<{ status: string; total_bugs: number; completed: number; message: string }> => {
  const resp = await api.post("/research/experiment/run", params);
  return resp.data;
};

export const getExperimentStatus = async (
  experiment_id: string
): Promise<PipelineStatus> => {
  const resp = await api.get(`/research/experiment/${experiment_id}/status`);
  return resp.data;
};

export const getExperimentResults = async (
  experiment_id: string
): Promise<{ total_bugs: number; results: any[]; has_metrics: boolean }> => {
  const resp = await api.get(`/research/experiment/${experiment_id}/results`);
  return resp.data;
};

// =============================================================================
// MODULE 5 — METRICS API
// =============================================================================

export const getFullMetrics = async (
  experiment_id: string
): Promise<FullMetrics> => {
  const resp = await api.get(`/research/metrics/${experiment_id}`);
  return resp.data;
};

// =============================================================================
// MODULE 6 — DASHBOARD API
// =============================================================================

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const resp = await api.get("/research/dashboard/summary");
  return resp.data;
};

// =============================================================================
// MODULE 7 — EXPORT API
// =============================================================================

export const exportCSV = async (experiment_id: string): Promise<string> => {
  const resp = await api.get(`/research/export/${experiment_id}/csv`);
  return resp.data;
};

export const exportJSON = async (experiment_id: string): Promise<any> => {
  const resp = await api.get(`/research/export/${experiment_id}/json`);
  return resp.data;
};

export const exportReport = async (experiment_id: string): Promise<ResearchReport> => {
  const resp = await api.get(`/research/export/${experiment_id}/report`);
  return resp.data;
};
