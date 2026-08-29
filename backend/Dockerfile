# Use official Python runtime as base image
FROM python:3.12-slim

# Build-arg controlled environment (production disables --reload)
ARG ENV=development
ENV ENV=${ENV}

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/docs')"

# Run FastAPI (production omits --reload)
CMD if [ "$ENV" = "production" ]; then \
      uvicorn main:app --host 0.0.0.0 --port 8000; \
    else \
      uvicorn main:app --host 0.0.0.0 --port 8000 --reload; \
    fi
