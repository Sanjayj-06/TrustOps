"""
services/runtime_trust.py
--------------------------
Runtime Trust Evaluation — Module 6.

Calculates Runtime Trust based on runtime observations and provides an explanation.
This is separate from the original pre-deployment Trust Score.
"""

from typing import Dict, Any, Tuple
from app.services.runtime_health import analyze_health

def evaluate_runtime_trust(metrics: Dict[str, Any]) -> Tuple[str, str]:
    """
    Evaluate runtime trust based on metrics and health.
    Returns: (Runtime_Trust_Level, Reason_Explanation)
    """
    health = analyze_health(metrics)
    
    cpu = metrics.get("cpu_usage", 0.0)
    latency = metrics.get("latency", 0.0)
    exceptions = metrics.get("exceptions", 0)
    test_failures = metrics.get("test_failures", 0)
    security_alerts = metrics.get("security_alerts", 0)
    success_rate = metrics.get("success_rate", 1.0)
    
    if health == "Critical":
        reasons = []
        if security_alerts > 0: reasons.append("Security alerts detected.")
        if exceptions > 5: reasons.append(f"High exception rate ({exceptions} thrown).")
        if test_failures > 0: reasons.append("Runtime test failures occurred.")
        if cpu > 90.0: reasons.append("CPU usage critically high.")
        if latency > 5000.0: reasons.append("Latency exceeds critical threshold.")
        
        reason_str = " ".join(reasons) if reasons else "Critical anomalies detected during execution."
        return "Low", reason_str

    elif health == "Warning":
        reasons = []
        if exceptions > 0: reasons.append("Minor exceptions caught.")
        if cpu > 70.0: reasons.append("Elevated CPU usage.")
        if latency > 2000.0: reasons.append("Elevated latency.")
        
        reason_str = " ".join(reasons) if reasons else "Sub-optimal execution metrics."
        return "Medium", reason_str

    else:
        return "High", "No exceptions. Low latency. Stable CPU usage. Successful executions."
