import api from "./trustpatch";
import axios from "axios";

// Define Types
export interface PatternDiscoveryResponse {
  most_common_bug_types: any[];
  successful_parameter_combinations: string[];
  failed_parameter_combinations: string[];
  frequent_runtime_issues: string[];
}

export interface TrustEvolutionTimeline {
  session_id: string;
  development_trust: number;
  developer_validation: string;
  runtime_trust: string;
  adapted_trust_recommended: number;
}

export interface AdaptationRecommendationResponse {
  session_id: string;
  current_weights: Record<string, number>;
  recommended_weights: Record<string, number>;
  confidence: string;
  reason: string;
}

export interface AnalyticsSummaryResponse {
  knowledge_base_size: number;
  evaluations: number;
  successful_repairs: number;
  average_trust: number;
  average_runtime_trust: string;
  average_acceptance_rate: number;
}

export interface ExperimentMetricsResponse {
  patch_ranking_accuracy: string;
  top_1_accuracy: string;
  top_3_accuracy: string;
  developer_acceptance_rate: string;
  override_rate: string;
  average_trust_score: number;
  average_runtime_trust: string;
  runtime_failure_rate: string;
  trust_stability: string;
  trust_calibration: string;
  average_confidence: string;
  repair_success_rate: string;
}

// Adaptation Endpoints
export const getPatterns = async (): Promise<PatternDiscoveryResponse> => {
  const resp = await api.get('/trustops/adaptation/patterns');
  return resp.data;
};

export const getEvolution = async (sessionId: string): Promise<TrustEvolutionTimeline> => {
  const resp = await api.get(`/trustops/adaptation/evolution/${sessionId}`);
  return resp.data;
};

export const getRecommendation = async (sessionId: string): Promise<AdaptationRecommendationResponse> => {
  const resp = await api.get(`/trustops/adaptation/recommendation/${sessionId}`);
  return resp.data;
};

// Analytics Endpoints
export const getAnalyticsSummary = async (): Promise<AnalyticsSummaryResponse> => {
  const resp = await api.get('/trustops/analytics/summary');
  return resp.data;
};

export const getExperimentMetrics = async (): Promise<ExperimentMetricsResponse> => {
  const resp = await api.get('/trustops/analytics/experiments');
  return resp.data;
};
