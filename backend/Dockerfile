# ============================================================
# TrustPatch Backend Dockerfile
# ============================================================
# Multi-stage aware single-stage build using Python 3.11 slim.
#
# Build args / design decisions:
#   - Uses python:3.11-slim to minimize image size (~200MB vs ~900MB full)
#   - Installs system deps for pylint, radon, and subprocess tools
#   - Copies requirements.txt first to leverage Docker layer cache
#   - Runs uvicorn with 1 worker (suitable for SQLite single-file DB)
#   - Exposes port 8000 (mapped in docker-compose.yml)
#   - SQLite database stored in /app/data/ (mounted as a volume)
# ============================================================

FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies needed for:
#   - pylint: requires gcc for some linting modules
#   - sentence-transformers: requires libgomp for BLAS
#   - subprocess: python3 must be in PATH for test runner
RUN apt-get update && apt-get install -y \
    gcc \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (cache optimization)
# This layer only rebuilds when requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create data directory for SQLite database persistence
RUN mkdir -p /app/data

# Copy application source code
COPY app/ ./app/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Expose the FastAPI port
EXPOSE 8000

# Health check for Docker orchestration
# Checks /health endpoint every 30 seconds
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start the FastAPI application with uvicorn
# --host 0.0.0.0 : bind to all interfaces (required inside Docker)
# --port 8000    : match EXPOSE above
# --reload       : disabled in production for performance
# Use shell form for CMD to allow environment variable expansion (Render sets $PORT dynamically)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
