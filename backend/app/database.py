"""
database.py
-----------
Sets up the SQLite database engine and session factory using SQLAlchemy.
- Creates the SQLite file at ./trustpatch.db (persisted via Docker volume)
- Provides `get_db` dependency for FastAPI route injection
- `Base` is the declarative base for all ORM models
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database URL — supports environment variable override for Docker
# In Docker: DATABASE_URL=sqlite:////app/data/trustpatch.db (volume mount)
# Locally:   sqlite:///./trustpatch.db (relative to working directory)
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trustpatch.db")

# Create the sync SQLAlchemy engine
# connect_args check_same_thread=False is required for SQLite with FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for ORM models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a DB session per request.
    Automatically closes the session after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
