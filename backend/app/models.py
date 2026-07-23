"""
models.py
---------
SQLAlchemy ORM models mapping to SQLite database tables.

Tables:
  - BugUpload     : Stores uploaded buggy file + test file content per session
  - GeneratedPatch: Stores each of the 5 generated patches with trust scores
  - PatchMetric   : Stores the 10 trust parameter values per patch (T,S,C,H,A,B,R,X,L,M)

Each session is identified by a unique session_id UUID so results can be grouped.
"""

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class BugUpload(Base):
    """
    BugUploads table.
    Stores the original buggy Python file and test file content
    for each evaluation session.
    """
    __tablename__ = "bug_uploads"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)  # UUID for grouping
    filename = Column(String)                              # Original buggy filename
    test_filename = Column(String)                         # Test file filename
    content = Column(Text)                                 # Buggy Python source code
    test_content = Column(Text)                            # Unit test source code
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class GeneratedPatch(Base):
    """
    GeneratedPatches table.
    Stores each candidate patch (P1–P5) generated for a session.
    Records trust score, whether selected by TAPR, and whether selected by BAPR.
    """
    __tablename__ = "generated_patches"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)     # Links to BugUpload.session_id
    patch_id = Column(String)                   # e.g. "P1", "P2", ...
    patch_code = Column(Text)                   # Modified Python source code
    trust_score = Column(Float, default=0.0)    # Computed TAPR trust score
    baseline_score = Column(Float, default=0.0) # Test pass rate (BAPR metric)
    selected = Column(Boolean, default=False)   # True if TAPR selected this patch
    baseline_selected = Column(Boolean, default=False)  # True if BAPR selected
    raw_metrics_json = Column(Text, nullable=True)      # Raw metrics before normalization


class PatchMetric(Base):
    """
    PatchMetrics table.
    Stores the 10 individual trust parameter values for each patch.
    Each column corresponds to one normalized trust parameter (0.0–1.0).
    """
    __tablename__ = "patch_metrics"

    id = Column(Integer, primary_key=True, index=True)
    patch_db_id = Column(Integer, index=True)  # FK to GeneratedPatch.id
    session_id = Column(String, index=True)
    patch_id = Column(String)

    # Trust Parameters (all normalized to [0, 1])
    T = Column(Float, default=0.0)  # Test Pass Rate
    S = Column(Float, default=0.0)  # Semantic Similarity
    C = Column(Float, default=0.0)  # Complexity Score (lower = better, inverted)
    H = Column(Float, default=0.0)  # Historical Success Rate
    A = Column(Float, default=0.0)  # Static Analysis Safety
    B = Column(Float, default=0.0)  # Behavioral Consistency
    R = Column(Float, default=0.0)  # Regression Risk (1 - failures/total)
    X = Column(Float, default=0.0)  # Contextual Importance
    L = Column(Float, default=0.0)  # LLM Confidence
    M = Column(Float, default=0.0)  # Multi-Patch Agreement

class VisitorCount(Base):
    """
    VisitorCount table.
    Stores the global website visitor count.
    """
    __tablename__ = "visitor_count"

    id = Column(Integer, primary_key=True, index=True)
    count = Column(Integer, default=21)


class HumanDecision(Base):
    """
    HumanDecisions table  — Module 4: Human-in-the-Loop Decision.
    Stores the developer's Accept / Reject / Override decision for the
    trust-selected patch of a given evaluation session.

    Decisions flow into the Knowledge Base for future pattern learning.
    """
    __tablename__ = "human_decisions"

    id                = Column(Integer, primary_key=True, index=True)
    session_id        = Column(String, index=True)        # Links to BugUpload.session_id
    patch_id          = Column(String)                    # Patch the decision is about
    agreement         = Column(String, nullable=True)     # "Yes" | "No" | "Partially"
    decision          = Column(String)                    # "accept" | "reject" | "override"
    override_patch_id = Column(String, nullable=True)     # If override: chosen patch ID
    reason            = Column(String, nullable=True)     # Predefined rejection reason
    comment           = Column(Text, nullable=True)       # Optional free-text comment
    timestamp         = Column(DateTime(timezone=True), server_default=func.now())


class KnowledgeBaseEntry(Base):
    """
    KnowledgeBaseEntries table — Module 5: Trust Knowledge Base.
    Stores a complete snapshot of a session's trust evaluation and human
    decision. Designed for extensibility: will be consumed by the Rule Engine
    and Pattern Learner in Phase 2.

    Columns:
      - Full patch metadata and source code
      - All 10 trust parameter values at decision time
      - Weight vector as JSON (allows future weight evolution)
      - Full structured explanation as JSON
      - Human decision + reason
    """
    __tablename__ = "knowledge_base_entries"

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(String, index=True)
    bug_filename     = Column(String)               # Uploaded buggy file name
    bug_id           = Column(String)               # Same as bug_filename for now
    patch_id         = Column(String)               # Patch that was decided on
    patch_rank       = Column(Integer)              # Rank of the selected patch
    recommended_patch_id = Column(String)           # Patch recommended by TAPR
    patch_code       = Column(Text)                 # Full patch source code
    trust_score      = Column(Float, default=0.0)   # Trust score at decision time
    confidence       = Column(String)               # High / Medium / Low

    # --- Trust Parameters (all 10, normalized [0,1]) ---
    T = Column(Float, default=0.0)  # Test Pass Rate
    S = Column(Float, default=0.0)  # Semantic Similarity
    C = Column(Float, default=0.0)  # Code Complexity (inverted)
    H = Column(Float, default=0.0)  # Historical Success
    A = Column(Float, default=0.0)  # Static Analysis Safety
    B = Column(Float, default=0.0)  # Behavioral Consistency
    R = Column(Float, default=0.0)  # Regression Risk
    X = Column(Float, default=0.0)  # Contextual Importance
    L = Column(Float, default=0.0)  # LLM Confidence
    M = Column(Float, default=0.0)  # Multi-Patch Agreement

    # --- Weight vector and explanation stored as JSON strings ---
    weights_json                 = Column(Text, nullable=True)  # JSON: {"T": 0.20, ...}
    parameter_contributions_json = Column(Text, nullable=True)  # JSON: {"T": 0.04, ...}
    explanation_json             = Column(Text, nullable=True)  # JSON: full structured explanation

    # --- Human decision fields ---
    agreement         = Column(String, nullable=True)  # "Yes" | "No" | "Partially"
    decision          = Column(String, nullable=True)  # "accept" | "reject" | "override"
    reason            = Column(String, nullable=True)  # Predefined reason
    comment           = Column(Text, nullable=True)    # Free-text comment

    # --- Runtime placeholders (Phase 3+) ---
    runtime_status       = Column(String, nullable=True)
    runtime_metrics_json = Column(Text, nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class RuntimeSession(Base):
    """
    RuntimeSessions table — Module 6: Runtime Trust Monitor.
    Tracks the overall runtime lifecycle of an accepted patch.
    """
    __tablename__ = "runtime_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, unique=True)  # Links to BugUpload.session_id
    patch_id = Column(String)                             # The patch deployed (usually accepted patch)
    status = Column(String, default="active")             # "active" | "stopped" | "error"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RuntimeMetric(Base):
    """
    RuntimeMetrics table.
    Periodic snapshots of execution telemetry for a deployed patch.
    """
    __tablename__ = "runtime_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    cpu_usage = Column(Float, default=0.0)      # % CPU
    memory_usage = Column(Float, default=0.0)   # MB
    peak_memory = Column(Float, default=0.0)    # MB
    latency = Column(Float, default=0.0)        # ms
    exceptions = Column(Integer, default=0)     # Count of runtime exceptions
    app_errors = Column(Integer, default=0)     # Count of logic/app errors
    test_failures = Column(Integer, default=0)  # Count of runtime test failures
    security_alerts = Column(Integer, default=0)# Count of security triggers
    
    executions = Column(Integer, default=0)     # Total executions monitored
    success_rate = Column(Float, default=1.0)   # Ratio of successful executions (0-1)


class RuntimeEvent(Base):
    """
    RuntimeEvents table.
    The timeline of observations combining health and trust.
    """
    __tablename__ = "runtime_events"
class BugUpload(Base):
    """
    BugUploads table.
    Stores the original buggy Python file and test file content
    for each evaluation session.
    """
    __tablename__ = "bug_uploads"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)  # UUID for grouping
    filename = Column(String)                              # Original buggy filename
    test_filename = Column(String)                         # Test file filename
    content = Column(Text)                                 # Buggy Python source code
    test_content = Column(Text)                            # Unit test source code
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class GeneratedPatch(Base):
    """
    GeneratedPatches table.
    Stores each candidate patch (P1–P5) generated for a session.
    Records trust score, whether selected by TAPR, and whether selected by BAPR.
    """
    __tablename__ = "generated_patches"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)     # Links to BugUpload.session_id
    patch_id = Column(String)                   # e.g. "P1", "P2", ...
    patch_code = Column(Text)                   # Modified Python source code
    trust_score = Column(Float, default=0.0)    # Computed TAPR trust score
    baseline_score = Column(Float, default=0.0) # Test pass rate (BAPR metric)
    selected = Column(Boolean, default=False)   # True if TAPR selected this patch
    baseline_selected = Column(Boolean, default=False)  # True if BAPR selected
    raw_metrics_json = Column(Text, nullable=True)      # Raw metrics before normalization


class PatchMetric(Base):
    """
    PatchMetrics table.
    Stores the 10 individual trust parameter values for each patch.
    Each column corresponds to one normalized trust parameter (0.0–1.0).
    """
    __tablename__ = "patch_metrics"

    id = Column(Integer, primary_key=True, index=True)
    patch_db_id = Column(Integer, index=True)  # FK to GeneratedPatch.id
    session_id = Column(String, index=True)
    patch_id = Column(String)

    # Trust Parameters (all normalized to [0, 1])
    T = Column(Float, default=0.0)  # Test Pass Rate
    S = Column(Float, default=0.0)  # Semantic Similarity
    C = Column(Float, default=0.0)  # Complexity Score (lower = better, inverted)
    H = Column(Float, default=0.0)  # Historical Success Rate
    A = Column(Float, default=0.0)  # Static Analysis Safety
    B = Column(Float, default=0.0)  # Behavioral Consistency
    R = Column(Float, default=0.0)  # Regression Risk (1 - failures/total)
    X = Column(Float, default=0.0)  # Contextual Importance
    L = Column(Float, default=0.0)  # LLM Confidence
    M = Column(Float, default=0.0)  # Multi-Patch Agreement

class VisitorCount(Base):
    """
    VisitorCount table.
    Stores the global website visitor count.
    """
    __tablename__ = "visitor_count"

    id = Column(Integer, primary_key=True, index=True)
    count = Column(Integer, default=21)


class HumanDecision(Base):
    """
    HumanDecisions table  — Module 4: Human-in-the-Loop Decision.
    Stores the developer's Accept / Reject / Override decision for the
    trust-selected patch of a given evaluation session.

    Decisions flow into the Knowledge Base for future pattern learning.
    """
    __tablename__ = "human_decisions"

    id                = Column(Integer, primary_key=True, index=True)
    session_id        = Column(String, index=True)        # Links to BugUpload.session_id
    patch_id          = Column(String)                    # Patch the decision is about
    agreement         = Column(String, nullable=True)     # "Yes" | "No" | "Partially"
    decision          = Column(String)                    # "accept" | "reject" | "override"
    override_patch_id = Column(String, nullable=True)     # If override: chosen patch ID
    reason            = Column(String, nullable=True)     # Predefined rejection reason
    comment           = Column(Text, nullable=True)       # Optional free-text comment
    timestamp         = Column(DateTime(timezone=True), server_default=func.now())


class KnowledgeBaseEntry(Base):
    """
    KnowledgeBaseEntries table — Module 5: Trust Knowledge Base.
    Stores a complete snapshot of a session's trust evaluation and human
    decision. Designed for extensibility: will be consumed by the Rule Engine
    and Pattern Learner in Phase 2.

    Columns:
      - Full patch metadata and source code
      - All 10 trust parameter values at decision time
      - Weight vector as JSON (allows future weight evolution)
      - Full structured explanation as JSON
      - Human decision + reason
    """
    __tablename__ = "knowledge_base_entries"

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(String, index=True)
    bug_filename     = Column(String)               # Uploaded buggy file name
    bug_id           = Column(String)               # Same as bug_filename for now
    patch_id         = Column(String)               # Patch that was decided on
    patch_rank       = Column(Integer)              # Rank of the selected patch
    recommended_patch_id = Column(String)           # Patch recommended by TAPR
    patch_code       = Column(Text)                 # Full patch source code
    trust_score      = Column(Float, default=0.0)   # Trust score at decision time
    confidence       = Column(String)               # High / Medium / Low

    # --- Trust Parameters (all 10, normalized [0,1]) ---
    T = Column(Float, default=0.0)  # Test Pass Rate
    S = Column(Float, default=0.0)  # Semantic Similarity
    C = Column(Float, default=0.0)  # Code Complexity (inverted)
    H = Column(Float, default=0.0)  # Historical Success
    A = Column(Float, default=0.0)  # Static Analysis Safety
    B = Column(Float, default=0.0)  # Behavioral Consistency
    R = Column(Float, default=0.0)  # Regression Risk
    X = Column(Float, default=0.0)  # Contextual Importance
    L = Column(Float, default=0.0)  # LLM Confidence
    M = Column(Float, default=0.0)  # Multi-Patch Agreement

    # --- Weight vector and explanation stored as JSON strings ---
    weights_json                 = Column(Text, nullable=True)  # JSON: {"T": 0.20, ...}
    parameter_contributions_json = Column(Text, nullable=True)  # JSON: {"T": 0.04, ...}
    explanation_json             = Column(Text, nullable=True)  # JSON: full structured explanation

    # --- Human decision fields ---
    agreement         = Column(String, nullable=True)  # "Yes" | "No" | "Partially"
    decision          = Column(String, nullable=True)  # "accept" | "reject" | "override"
    reason            = Column(String, nullable=True)  # Predefined reason
    comment           = Column(Text, nullable=True)    # Free-text comment

    # --- Runtime placeholders (Phase 3+) ---
    runtime_status       = Column(String, nullable=True)
    runtime_metrics_json = Column(Text, nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class RuntimeSession(Base):
    """
    RuntimeSessions table — Module 6: Runtime Trust Monitor.
    Tracks the overall runtime lifecycle of an accepted patch.
    """
    __tablename__ = "runtime_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, unique=True)  # Links to BugUpload.session_id
    patch_id = Column(String)                             # The patch deployed (usually accepted patch)
    status = Column(String, default="active")             # "active" | "stopped" | "error"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RuntimeMetric(Base):
    """
    RuntimeMetrics table.
    Periodic snapshots of execution telemetry for a deployed patch.
    """
    __tablename__ = "runtime_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    cpu_usage = Column(Float, default=0.0)      # % CPU
    memory_usage = Column(Float, default=0.0)   # MB
    peak_memory = Column(Float, default=0.0)    # MB
    latency = Column(Float, default=0.0)        # ms
    exceptions = Column(Integer, default=0)     # Count of runtime exceptions
    app_errors = Column(Integer, default=0)     # Count of logic/app errors
    test_failures = Column(Integer, default=0)  # Count of runtime test failures
    security_alerts = Column(Integer, default=0)# Count of security triggers
    
    executions = Column(Integer, default=0)     # Total executions monitored
    success_rate = Column(Float, default=1.0)   # Ratio of successful executions (0-1)


class RuntimeEvent(Base):
    """
    RuntimeEvents table.
    The timeline of observations combining health and trust.
    """
    __tablename__ = "runtime_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    health_status = Column(String)    # "Healthy" | "Warning" | "Critical"
    runtime_trust = Column(String)    # "High" | "Medium" | "Low"
    reason = Column(String)           # Natural language explanation
    metrics_snapshot = Column(Text)   # JSON string of metrics when event occurred


class AdaptationRecommendation(Base):
    """
    AdaptationRecommendation table — Module 7: Trust Adaptation Engine.
    Stores recommended weight changes without overwriting the original weights.
    """
    __tablename__ = "adaptation_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    current_weights_json = Column(Text)      # Snapshot of weights before adaptation
    recommended_weights_json = Column(Text)  # The proposed weights
    confidence = Column(String)              # "High" | "Medium" | "Low"
    reason = Column(Text)                    # E.g. "Historically correlated with successful runtime behaviour"
    status = Column(String, default="Pending") # "Pending" | "Approved" | "Rejected"
