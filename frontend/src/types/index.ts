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
