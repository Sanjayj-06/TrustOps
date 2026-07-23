"""
services/adaptation_engine.py
-----------------------------
Trust Adaptation Engine — Module 7

Compares current session trust weights with discovered patterns to generate
Adaptation Recommendations. Does not overwrite historical weights directly.
"""

import json
from sqlalchemy.orm import Session
from app import models
from typing import Dict, Any

def generate_adaptation_recommendation(db: Session, session_id: str) -> models.AdaptationRecommendation:
    # Get existing recommendation if any
    existing = db.query(models.AdaptationRecommendation).filter(
        models.AdaptationRecommendation.session_id == session_id
    ).first()
    if existing:
        return existing

    # Find the Knowledge Base Entry
    kb_entry = db.query(models.KnowledgeBaseEntry).filter(
        models.KnowledgeBaseEntry.session_id == session_id
    ).first()

    if not kb_entry:
        raise ValueError(f"No Knowledge Base entry found for session {session_id}")

    current_weights = {}
    if kb_entry.weights_json:
        try:
            current_weights = json.loads(kb_entry.weights_json)
        except:
            pass
            
    # Default fallback if empty
    if not current_weights:
        current_weights = {
            "T": 0.20, "S": 0.15, "C": 0.10, "H": 0.10, "A": 0.15,
            "B": 0.10, "R": 0.10, "X": 0.05, "L": 0.03, "M": 0.02
        }

    recommended_weights = current_weights.copy()
    reason = "Historically correlated with successful runtime behaviour."

    # Simple logic for adaptation recommendation based on runtime status
    if kb_entry.runtime_status == "Healthy":
        # Boost S and A slightly
        if "S" in recommended_weights: recommended_weights["S"] = round(min(0.25, recommended_weights["S"] + 0.02), 3)
        if "A" in recommended_weights: recommended_weights["A"] = round(min(0.25, recommended_weights["A"] + 0.02), 3)
        reason = "Boosted Semantic Similarity (S) and Static Analysis (A) based on successful runtime."
    elif kb_entry.runtime_status in ["Warning", "Critical"]:
        # Boost R (Regression) and C (Complexity)
        if "R" in recommended_weights: recommended_weights["R"] = round(min(0.30, recommended_weights["R"] + 0.05), 3)
        if "C" in recommended_weights: recommended_weights["C"] = round(min(0.20, recommended_weights["C"] + 0.03), 3)
        reason = "Boosted Regression Risk (R) and Code Complexity (C) weights due to runtime anomalies."

    # Normalize weights so they sum to 1.0
    total = sum(recommended_weights.values())
    if total > 0:
        recommended_weights = {k: round(v / total, 3) for k, v in recommended_weights.items()}

    recommendation = models.AdaptationRecommendation(
        session_id=session_id,
        current_weights_json=json.dumps(current_weights),
        recommended_weights_json=json.dumps(recommended_weights),
        confidence="High",
        reason=reason,
        status="Pending"
    )
    
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    
    return recommendation

def get_session_evolution(db: Session, session_id: str) -> Dict[str, Any]:
    kb_entry = db.query(models.KnowledgeBaseEntry).filter(
        models.KnowledgeBaseEntry.session_id == session_id
    ).first()
    
    if not kb_entry:
        return {}
        
    dev_trust = kb_entry.trust_score
    dev_validation = kb_entry.decision or "Pending"
    runtime_trust = "Pending"
    
    runtime_event = db.query(models.RuntimeEvent).filter(
        models.RuntimeEvent.session_id == session_id
    ).order_by(models.RuntimeEvent.timestamp.desc()).first()
    
    if runtime_event:
        runtime_trust = runtime_event.runtime_trust
        
    rec = generate_adaptation_recommendation(db, session_id)
    rec_weights = json.loads(rec.recommended_weights_json) if rec.recommended_weights_json else {}
    adapted_trust = dev_trust * 1.05 if runtime_trust == "High" else dev_trust * 0.95
    
    return {
        "session_id": session_id,
        "development_trust": round(dev_trust, 3),
        "developer_validation": dev_validation,
        "runtime_trust": runtime_trust,
        "adapted_trust_recommended": round(min(1.0, adapted_trust), 3)
    }
