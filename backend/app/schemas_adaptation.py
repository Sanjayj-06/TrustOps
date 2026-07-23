from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class AnalyticsSummaryResponse(BaseModel):
    knowledge_base_size: int
    evaluations: int
    successful_repairs: int
    average_trust: float
    average_runtime_trust: str
    average_acceptance_rate: float

class PatternDiscoveryResponse(BaseModel):
    most_common_bug_types: List[Dict[str, Any]]
    successful_parameter_combinations: List[str]
    failed_parameter_combinations: List[str]
    frequent_runtime_issues: List[str]

class TrustEvolutionTimeline(BaseModel):
    session_id: str
    development_trust: float
    developer_validation: str
    runtime_trust: str
    adapted_trust_recommended: float

class AdaptationRecommendationResponse(BaseModel):
    session_id: str
    current_weights: Dict[str, float]
    recommended_weights: Dict[str, float]
    confidence: str
    reason: str

class ExperimentMetricsResponse(BaseModel):
    patch_ranking_accuracy: str
    top_1_accuracy: str
    top_3_accuracy: str
    developer_acceptance_rate: str
    override_rate: str
    average_trust_score: float
    average_runtime_trust: str
    runtime_failure_rate: str
    trust_stability: str
    trust_calibration: str
    average_confidence: str
    repair_success_rate: str
