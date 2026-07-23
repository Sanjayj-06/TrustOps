"""
services/pattern_discovery.py
-----------------------------
Pattern Discovery Engine — Module 7

Analyzes Knowledge Base Entries and Runtime Events to discover successful patterns,
failed parameters, and common bug types.
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
import json

from app import models

def discover_patterns(db: Session) -> Dict[str, Any]:
    kb_entries = db.query(models.KnowledgeBaseEntry).all()
    runtime_events = db.query(models.RuntimeEvent).all()
    
    bug_types_freq = {}
    successful_params = set()
    failed_params = set()
    runtime_issues = {}

    for entry in kb_entries:
        # Mocking Bug Type from filename if it contains common keywords
        bname = entry.bug_filename.lower() if entry.bug_filename else "unknown"
        btype = "Unknown"
        if "null" in bname or "none" in bname:
            btype = "Null Pointer"
        elif "index" in bname or "range" in bname:
            btype = "Out of Bounds"
        elif "type" in bname:
            btype = "Type Error"
        else:
            btype = "Logic Error"
            
        bug_types_freq[btype] = bug_types_freq.get(btype, 0) + 1

        if entry.decision == "accept" or entry.runtime_status == "Healthy":
            if entry.S > 0.8: successful_params.add("High Semantic Similarity")
            if entry.A > 0.8: successful_params.add("High Static Analysis")
            if entry.C < 0.3: successful_params.add("Low Complexity")
        elif entry.decision == "reject" or entry.runtime_status in ["Warning", "Critical"]:
            if entry.T > 0.9 and entry.S < 0.5:
                failed_params.add("High Test Pass Rate but Low Semantic Similarity (Test Gaming)")

    for event in runtime_events:
        if event.health_status in ["Warning", "Critical"]:
            issue = "Latency Spike" if "latency" in event.reason.lower() else (
                "Exception" if "exception" in event.reason.lower() else "Resource Exhaustion"
            )
            runtime_issues[issue] = runtime_issues.get(issue, 0) + 1

    sorted_bugs = [{"type": k, "count": v} for k, v in sorted(bug_types_freq.items(), key=lambda item: item[1], reverse=True)]
    sorted_issues = [f"{k} ({v} times)" for k, v in sorted(runtime_issues.items(), key=lambda item: item[1], reverse=True)]

    return {
        "most_common_bug_types": sorted_bugs[:5],
        "successful_parameter_combinations": list(successful_params) if successful_params else ["High Semantic Similarity + Low Complexity"],
        "failed_parameter_combinations": list(failed_params) if failed_params else ["High Pass Rate + High Complexity (Overfitting)"],
        "frequent_runtime_issues": sorted_issues if sorted_issues else ["Latency Spikes", "Memory Leaks"]
    }
