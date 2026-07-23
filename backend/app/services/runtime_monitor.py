"""
services/runtime_monitor.py
---------------------------
Runtime Trust Monitor — Module 6.

Orchestrates starting a session, collecting simulated metrics, and generating timeline events.
"""

import json
import random
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app import models
from app.services.runtime_health import analyze_health
from app.services.runtime_trust import evaluate_runtime_trust


def start_runtime_session(db: Session, session_id: str, patch_id: str) -> models.RuntimeSession:
    """
    Initializes a runtime session for a given session_id and patch.
    Generates an initial baseline event.
    """
    # Check if session already exists
    session = db.query(models.RuntimeSession).filter(
        models.RuntimeSession.session_id == session_id
    ).first()
    
    if not session:
        session = models.RuntimeSession(
            session_id=session_id,
            patch_id=patch_id,
            status="active"
        )
        db.add(session)
        db.flush()

        # Generate initial deployment event
        _create_event(
            db=db,
            session_id=session_id,
            health_status="Healthy",
            runtime_trust="High",
            reason="Initial Deployment: System initialized successfully.",
            metrics={}
        )
        db.commit()

    return session


def simulate_metrics(db: Session, session_id: str) -> models.RuntimeEvent:
    """
    Pushes simulated metrics into an active session and generates a new event.
    """
    session = db.query(models.RuntimeSession).filter(
        models.RuntimeSession.session_id == session_id
    ).first()
    
    if not session:
        raise ValueError(f"Runtime session '{session_id}' not found.")

    # Generate plausible simulated metrics
    is_anomaly = random.random() < 0.2  # 20% chance of anomaly
    is_critical = random.random() < 0.05 # 5% chance of critical failure
    
    cpu = random.uniform(10.0, 40.0)
    memory = random.uniform(50.0, 200.0)
    latency = random.uniform(10.0, 50.0)
    exceptions = 0
    test_failures = 0
    security_alerts = 0
    success_rate = 1.0
    executions = random.randint(100, 1000)

    if is_critical:
        cpu = random.uniform(85.0, 100.0)
        memory = random.uniform(800.0, 2048.0)
        latency = random.uniform(3000.0, 8000.0)
        exceptions = random.randint(5, 50)
        success_rate = random.uniform(0.5, 0.8)
        if random.random() < 0.5:
            security_alerts = 1
    elif is_anomaly:
        cpu = random.uniform(60.0, 80.0)
        memory = random.uniform(300.0, 600.0)
        latency = random.uniform(1000.0, 2500.0)
        exceptions = random.randint(1, 4)
        success_rate = random.uniform(0.9, 0.99)

    metrics_dict = {
        "cpu_usage": cpu,
        "memory_usage": memory,
        "peak_memory": memory * 1.1,
        "latency": latency,
        "exceptions": exceptions,
        "app_errors": 0,
        "test_failures": test_failures,
        "security_alerts": security_alerts,
        "executions": executions,
        "success_rate": success_rate,
    }

    # Save metrics snapshot
    metric_record = models.RuntimeMetric(
        session_id=session_id,
        **metrics_dict
    )
    db.add(metric_record)
    
    # Analyze and evaluate
    health = analyze_health(metrics_dict)
    trust, reason = evaluate_runtime_trust(metrics_dict)

    # Create event
    event = _create_event(
        db=db,
        session_id=session_id,
        health_status=health,
        runtime_trust=trust,
        reason=reason,
        metrics=metrics_dict
    )
    
    # Update Knowledge Base entry if exists
    kb_entry = db.query(models.KnowledgeBaseEntry).filter(
        models.KnowledgeBaseEntry.session_id == session_id
    ).first()
    
    if kb_entry:
        kb_entry.runtime_status = health
        kb_entry.runtime_metrics_json = json.dumps(metrics_dict)
    
    db.commit()
    return event


def _create_event(
    db: Session, 
    session_id: str, 
    health_status: str, 
    runtime_trust: str, 
    reason: str, 
    metrics: Dict[str, Any]
) -> models.RuntimeEvent:
    event = models.RuntimeEvent(
        session_id=session_id,
        health_status=health_status,
        runtime_trust=runtime_trust,
        reason=reason,
        metrics_snapshot=json.dumps(metrics)
    )
    db.add(event)
    db.flush()
    return event


def get_latest_metrics(db: Session, session_id: str) -> Dict[str, Any]:
    metric = db.query(models.RuntimeMetric).filter(
        models.RuntimeMetric.session_id == session_id
    ).order_by(models.RuntimeMetric.timestamp.desc()).first()
    
    if not metric:
        return {}
    
    return {
        "cpu_usage": metric.cpu_usage,
        "memory_usage": metric.memory_usage,
        "peak_memory": metric.peak_memory,
        "latency": metric.latency,
        "exceptions": metric.exceptions,
        "app_errors": metric.app_errors,
        "test_failures": metric.test_failures,
        "security_alerts": metric.security_alerts,
        "executions": metric.executions,
        "success_rate": metric.success_rate,
        "timestamp": metric.timestamp.isoformat() if metric.timestamp else None
    }


def get_event_history(db: Session, session_id: str) -> List[Dict[str, Any]]:
    events = db.query(models.RuntimeEvent).filter(
        models.RuntimeEvent.session_id == session_id
    ).order_by(models.RuntimeEvent.timestamp.asc()).all()
    
    result = []
    for e in events:
        metrics = {}
        if e.metrics_snapshot:
            try:
                metrics = json.loads(e.metrics_snapshot)
            except:
                pass
        
        result.append({
            "id": e.id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "health_status": e.health_status,
            "runtime_trust": e.runtime_trust,
            "reason": e.reason,
            "metrics": metrics
        })
    return result
