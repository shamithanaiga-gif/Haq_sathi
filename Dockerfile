# ==============================================================================
# Haq Saathi - Production Dockerfile
# Multi-stage optimized build for FastAPI backend running on Python 3.11
# ==============================================================================

FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    APP_HOME=/app

WORKDIR ${APP_HOME}

# Install system dependencies (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code and mock data
COPY backend/ ./backend/
COPY data/ ./data/
COPY frontend/ ./frontend/
COPY run.py .

# Create non-root user for security
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser ${APP_HOME}

USER appuser

EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/schemes || exit 1

# Launch with 4 workers, proxy header forwarding, and trust all upstream proxies
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers", "--forwarded-allow-ips=*"]
