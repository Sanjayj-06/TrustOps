"""
routers/adaptation.py
---------------------
Adaptation Engine API — Module 7
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas_adaptation import (
    PatternDiscoveryResponse,
    TrustEvolutionTimeline,
    AdaptationRecommendationResponse
)
from app.services.pattern_discovery import discover_patterns
from app.services.adaptation_engine import generate_adaptation_recommendation, get_session_evolution
import json

router = APIRouter(prefix="/trustops/adaptation", tags=["trustops-adaptation"])

@router.get("/patterns", response_model=PatternDiscoveryResponse, summary="Discover historical patterns")
def get_patterns(db: Session = Depends(get_db)):
    return discover_patterns(db)

@router.get("/evolution/{session_id}", response_model=TrustEvolutionTimeline, summary="Get session trust evolution")
def get_evolution(session_id: str, db: Session = Depends(get_db)):
    evolution = get_session_evolution(db, session_id)
    if not evolution:
        raise HTTPException(status_code=404, detail="Session not found in Knowledge Base.")
    return evolution

@router.get("/recommendation/{session_id}", response_model=AdaptationRecommendationResponse, summary="Get adaptation recommendation")
def get_recommendation(session_id: str, db: Session = Depends(get_db)):
    try:
        rec = generate_adaptation_recommendation(db, session_id)
        current = json.loads(rec.current_weights_json)
        recommended = json.loads(rec.recommended_weights_json)
        return {
            "session_id": rec.session_id,
            "current_weights": current,
            "recommended_weights": recommended,
            "confidence": rec.confidence,
            "reason": rec.reason
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
