"""
routers/analytics.py
--------------------
Knowledge Analytics API — Module 7
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas_adaptation import (
    AnalyticsSummaryResponse,
    ExperimentMetricsResponse
)
from app.services.analytics import get_analytics_summary, get_experiment_metrics

router = APIRouter(prefix="/trustops/analytics", tags=["trustops-analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse, summary="Get high-level knowledge analytics")
def get_summary(db: Session = Depends(get_db)):
    return get_analytics_summary(db)

@router.get("/experiments", response_model=ExperimentMetricsResponse, summary="Get research experiment metrics")
def get_experiments(db: Session = Depends(get_db)):
    return get_experiment_metrics(db)
