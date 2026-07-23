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
