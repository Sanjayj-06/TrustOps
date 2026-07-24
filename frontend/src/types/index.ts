/**
 * types/index.ts
 * --------------
 * TypeScript interfaces matching the FastAPI Pydantic schemas.
 * These ensure type safety across all frontend components and API calls.
 */

// ============================================================
// Upload Types
// ============================================================

export interface UploadResponse {
  session_id: string;
  filename: string;
  test_filename: string;
  message: string;
}

// ============================================================
// Trust Metrics — 10 parameters per patch
// ============================================================

export interface TrustMetrics {
  T: number;  // Test Pass Rate
  S: number;  // Semantic Similarity
  C: number;  // Complexity Score (inverted)
  H: number;  // Historical Success
  A: number;  // Static Analysis Safety
  B: number;  // Behavioral Consistency
  R: number;  // Regression Risk
  X: number;  // Contextual Importance
  L: number;  // LLM Confidence
  M: number;  // Multi-Patch Agreement
}

export const PARAM_LABELS: Record<keyof TrustMetrics, string> = {
  T: 'Test Pass Rate',
  S: 'Semantic Similarity',
  C: 'Complexity',
  H: 'Historical Success',
  A: 'Static Analysis',
  B: 'Behavioral',
  R: 'Regression Risk',
  X: 'Contextual',
  L: 'LLM Confidence',
  M: 'Multi-Patch',
};

export const PARAM_DESCRIPTIONS: Record<keyof TrustMetrics, string> = {
  T: 'Ratio of unit tests passed — measures functional correctness',
  S: 'Cosine similarity to known correct fix embeddings',
  C: 'Inverted cyclomatic complexity — simpler patches score higher',
  H: 'Historical repair success rate for similar bug patterns',
  A: 'Pylint/static analysis score — fewer warnings = higher score',
  B: 'Behavioral consistency vs original code behavior',
  R: '1 - regression failure rate — lower risk = higher score',
  X: 'Critical module weight (auth=1.0, payments=0.9, utils=0.4)',
  L: 'LLM confidence in the fix correctness (0–1)',
  M: 'Average pairwise similarity across all 5 patches (consensus)',
};

export const WEIGHTS: Record<keyof TrustMetrics, number> = {
  T: 0.20,
  S: 0.10,
  C: 0.10,
  H: 0.10,
  A: 0.10,
  B: 0.10,
  R: 0.10,
  X: 0.05,
  L: 0.10,
  M: 0.05,
};

// ============================================================
// Patch Types
// ============================================================

export interface PatchInfo {
  patch_id: string;
  patch_code: string;
  trust_score: number;
  baseline_score: number;
  rank: number;
  metrics: TrustMetrics;
  explanation: string;
  strategy?: string;
  is_test_gaming?: boolean;
}

// ============================================================
// Pipeline Results
// ============================================================

export interface BaselineResult {
  selected_patch: string;
  passed_tests: number;
  total_tests: number;
  pass_rate: number;
  execution_time: number;
  patch_code: string;
  is_test_gaming_patch?: boolean;   // true when BAPR fell for the trap
  strategy?: string;
}

export interface TrustPatchResult {
  selected_patch: string;
  trust_score: number;
  risk: 'Low' | 'Medium' | 'High';
  recommendation: 'Accept' | 'Review' | 'Reject';
  explanation: string;
  execution_time: number;
  patch_code: string;
  top_factors: string[];
  pass_rate: number;
  passed_tests: number;
  total_tests: number;
  strategy?: string;
}

// ============================================================
// Explainability
// ============================================================

export interface ExplanationData {
  summary: string;
  bullets: string[];
  top_factors: string[];
  comparison: string;
  risk_level: string;
  recommendation: string;
  risk_icon: string;
  parameter_impact: Record<string, number>;
  diverged: boolean;               // true = BAPR and TAPR picked different patches
  bapr_trap_triggered: boolean;    // true = BAPR fell for the test-gaming trap
  bapr_trap_reason?: string;       // human-readable trap explanation
  rejected_patch_id?: string;      // which patch TrustPatch rejected
  rejected_trust_score?: number;   // trust score of the rejected patch
}

// ============================================================
// Chart Data Types (Recharts-compatible)
// ============================================================

export interface TestSuccessChartData {
  approach: string;
  passRate: number;
  passed: number;
  total: number;
  color: string;
}

export interface TrustScoreChartData {
  patchId: string;
  trustScore: number;
  rank: number;
  selected: boolean;
  baselineSelected: boolean;
  color: string;
  isTestGaming?: boolean;
}

export interface MetricChartData {
  patchId: string;
  value: number;
  label: string;
  selected: boolean;
  isTestGaming?: boolean;
}

export interface ExecutionTimeChartData {
  approach: string;
  time: number;
  color: string;
  label: string;
}

export interface WeightChartData {
  parameter: string;
  shortName: string;
  weight: number;
  value: number;
}

export interface RadarDataPoint {
  parameter: string;
  shortName: string;
  P1: number;
  P2: number;
  P3: number;
  P4: number;
  P5: number;
}

export interface AllMetricsRow extends TrustMetrics {
  patchId: string;
  trustScore: number;
  rank: number;
  selected: boolean;
  baselineScore: number;
  baselineSelected?: boolean;
  isTestGaming?: boolean;
  strategy?: string;
}

export interface ChartData {
  test_success_comparison: TestSuccessChartData[];
  trust_score_distribution: TrustScoreChartData[];
  complexity_comparison: MetricChartData[];
  safety_comparison: MetricChartData[];
  execution_time_comparison: ExecutionTimeChartData[];
  weight_distribution: WeightChartData[];
  radar_data: RadarDataPoint[];
  all_metrics_comparison: AllMetricsRow[];
}

// ============================================================
// Full Evaluation Response
// ============================================================

export interface EvaluationResponse {
  session_id: string;
  patches: PatchInfo[];
  baseline: BaselineResult;
  trustpatch: TrustPatchResult;
  explanation: ExplanationData;
  comparison_summary: string;
  weights: Record<string, number>;
  chart_data: ChartData;
  diverged: boolean;
  bapr_trap_triggered: boolean;
}

// ============================================================
// Pipeline Step Status (for animated UI)
// ============================================================

export type StepStatus = 'pending' | 'running' | 'done' | 'error';

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
  duration?: number;
}

// ============================================================
// App State
// ============================================================

export type AppPhase =
  | 'upload'        // Initial upload state
  | 'processing'    // Pipeline running
  | 'results';      // Results displayed

export interface AppState {
  phase: AppPhase;
  sessionId: string | null;
  filename: string | null;
  testFilename: string | null;
  evaluation: EvaluationResponse | null;
  error: string | null;
}

// ============================================================
// TrustOps Phase 1 — Explanation Engine Types
// ============================================================

export interface ParameterExplanation {
  param:            string;  // "T", "S", "C", ...
  label:            string;  // "Test Pass Rate"
  raw_score:        number;  // Raw unnormalized score
  normalized_score: number;  // [0, 1]
  weight:           number;  // Expert weight
  contribution:     number;  // normalized_score × weight
  status:           'strong' | 'moderate' | 'weak';
  short_reason:     string;
  example:          string;  // Example or evidence
}

export interface PatchOverallExplanation {
  summary:         string;
  confidence:      'High' | 'Medium' | 'Low';
  recommendation:  'Accept' | 'Review' | 'Reject';
  risk_level:      'Low' | 'Medium' | 'High';
  key_reasons:     string[];
  key_strengths:   string[];
  potential_risks: string[];
}

export interface PatchExplanation {
  patch_id:    string;
  trust_score: number;
  rank:        number;
  overall:     PatchOverallExplanation;
  parameters:  ParameterExplanation[];
}

export interface SessionExplanationResponse {
  session_id:        string;
  bug_filename:      string;
  selected_patch_id: string;
  baseline_patch_id: string;
  patches:           PatchExplanation[];
}

// ============================================================
// TrustOps Phase 1 — Human-in-the-Loop Decision Types
// ============================================================

export type DecisionType = 'accept' | 'reject' | 'override';

export const DECISION_REASONS = [
  'Logic Incorrect',
  'Performance Issue',
  'Security Concern',
  'Readability',
  'Maintainability',
  'Other',
] as const;

export type DecisionReason = typeof DECISION_REASONS[number];

export interface DecisionRequest {
  session_id:        string;
  patch_id:          string;
  agreement:         string;
  decision:          DecisionType;
  override_patch_id?: string;
  reason?:           string;
  comment?:          string;
}

export interface DecisionResponse {
  success:                 boolean;
  decision_id:             number;
  knowledge_base_entry_id: number | null;
  message:                 string;
}

export interface HumanDecision {
  session_id:        string;
  patch_id:          string;
  agreement:         string;
  decision:          DecisionType;
  override_patch_id?: string;
  reason?:           string;
  comment?:          string;
  timestamp?:        string;
}

// ============================================================
// TrustOps Phase 1 — Knowledge Base Types
// ============================================================

export interface KnowledgeSummary {
  total_entries:                number;
  decisions:                    Record<string, number>;
  most_common_rejection_reason: string | null;
  avg_trust_score_accepted:     number | null;
  avg_trust_score_rejected:     number | null;
  avg_trust_score_overridden:   number | null;
  recent_entries:               any[]; // Could be typed strictly if needed
}

export interface KnowledgeBaseEntry {
  id: number;
  session_id: string;
  bug_filename: string;
  patch_id: string;
  trust_score: number;
  decision: "accept" | "reject" | "override";
  reason: string | null;
  timestamp: string;
  metrics: {
    T: number; S: number; C: number; H: number; A: number;
    B: number; R: number; X: number; L: number; M: number;
  };
}

export interface KnowledgeBaseListResponse {
  total: number;
  entries: KnowledgeBaseEntry[];
}
