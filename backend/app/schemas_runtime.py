from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RuntimeStartRequest(BaseModel):
    session_id: str
    patch_id: str

class RuntimeSimulateRequest(BaseModel):
    session_id: str

class RuntimeMetricsResponse(BaseModel):
    cpu_usage: float
    memory_usage: float
    peak_memory: float
    latency: float
    exceptions: int
    app_errors: int
    test_failures: int
    security_alerts: int
    executions: int
    success_rate: float
    timestamp: Optional[str] = None

class RuntimeEventResponse(BaseModel):
    id: int
    timestamp: Optional[str]
    health_status: str
    runtime_trust: str
    reason: str
    metrics: Dict[str, Any]

class RuntimeHistoryResponse(BaseModel):
    session_id: str
    events: List[RuntimeEventResponse]

class RuntimeHealthResponse(BaseModel):
    session_id: str
    health_status: str
    runtime_trust: str
    reason: str
