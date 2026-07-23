# This Dockerfile is placed in the root directory specifically for Render.com
# Render expects the Dockerfile to be in the root unless configured otherwise.
# This simply builds the backend application from the root context.

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/data

# Copy backend application source code
COPY backend/app/ ./app/

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Use shell form for CMD to allow environment variable expansion (Render sets $PORT dynamically)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
