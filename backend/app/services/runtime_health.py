"""
services/runtime_health.py
--------------------------
Runtime Health Analyzer — Module 6.

Evaluates runtime metrics and classifies overall health as Healthy, Warning, or Critical.
"""

from typing import Dict, Any

def analyze_health(metrics: Dict[str, Any]) -> str:
    """
    Evaluates runtime metrics and returns a health status.
    Returns: "Healthy", "Warning", or "Critical".
    """
    cpu = metrics.get("cpu_usage", 0.0)
    memory = metrics.get("memory_usage", 0.0)
    latency = metrics.get("latency", 0.0)
    exceptions = metrics.get("exceptions", 0)
    app_errors = metrics.get("app_errors", 0)
    test_failures = metrics.get("test_failures", 0)
    security_alerts = metrics.get("security_alerts", 0)

    # Critical conditions
    if security_alerts > 0:
        return "Critical"
    if exceptions > 5 or app_errors > 10:
        return "Critical"
    if test_failures > 0:
        return "Critical"
    if cpu > 90.0 or memory > 1024.0 or latency > 5000.0:
        return "Critical"

    # Warning conditions
    if exceptions > 0 or app_errors > 0:
        return "Warning"
    if cpu > 70.0 or memory > 512.0 or latency > 2000.0:
        return "Warning"

    # Otherwise healthy
    return "Healthy"
