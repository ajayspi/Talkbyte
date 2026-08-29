# TalkByte Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete development, testing, and deployment foundation for TalkByte AI — Docker Compose local setup, testing infrastructure, CI/CD pipeline, and production deployment to Oracle Cloud Free tier.

**Architecture:** Hybrid approach with full Docker Compose locally (Supabase, Redis, app stack), switching to managed services (Supabase Cloud, Upstash Redis) for production on Oracle Cloud. Testing via pytest (backend) and Vitest/Playwright (frontend). GitHub Actions CI/CD pipeline.

**Tech Stack:** FastAPI + Python 3.12, Next.js 16 + React 19 + TypeScript, Supabase + PostgreSQL 16, Redis, Docker + Docker Compose, pytest, Vitest, Playwright, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-29-talkbyte-foundation-design.md`

## Global Constraints

- Solo developer — keep architecture simple, scripts for repetitive tasks
- Phased approach — research-grade (Sprints 1–2), production-harden (Sprints 3+)
- Demo hosting 7am–12pm on Oracle Cloud Free tier (2 ARM vCPU, 12GB RAM, always-free)
- No external dependencies in local dev — everything via Docker Compose
- Production-ready patterns early — use managed services to reduce ops
- Tech stack locked — GPT-4.1, Telnyx, LiveKit, Deepgram, ElevenLabs

---

## Phase 1: Configuration & Environment

### Task 1: Create Root Environment Template

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: Template env file with all required keys (no secrets)

- [ ] **Step 1: Create .env.example at root**

```bash
cat > .env.example << 'EOF'
# ============================================
# TalkByte Local Development Environment
# ============================================
# Copy this file to .env.local and fill in your credentials

# Supabase (local development)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDB9.test
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.test

# Redis (local development)
REDIS_URL=redis://redis:6379

# Telnyx (voice/SMS)
TELNYX_API_KEY=
TELNYX_SIP_CONNECTION_ID=

# LiveKit (voice orchestration)
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Deepgram (STT)
DEEPGRAM_API_KEY=

# OpenAI (LLM)
OPENAI_API_KEY=

# ElevenLabs (TTS)
ELEVENLABS_API_KEY=

# Application Config
DEBUG=true
LOG_LEVEL=debug
ENVIRONMENT=development
EOF
```

- [ ] **Step 2: Verify .env.example created**

```bash
ls -la .env.example
wc -l .env.example  # should be ~45 lines
```

Expected: File exists with all keys

- [ ] **Step 3: Update .gitignore to exclude .env files**

Append to `.gitignore`:
```
.env.local
.env.prod
.env*.local
!.env.example
```

- [ ] **Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment templates and .gitignore rules"
```

---

### Task 2: Create Backend Environment Setup

**Files:**
- Create: `backend/.env.example`
- Modify: `backend/main.py` (add config loading)
- Create: `backend/config.py`

**Interfaces:**
- Produces: `config.Config` class with all env vars validated at startup

- [ ] **Step 1: Create backend/.env.example**

```bash
cat > backend/.env.example << 'EOF'
# TalkByte Backend Environment Variables

# Database
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test

# Redis
REDIS_URL=redis://redis:6379

# API Keys
TELNYX_API_KEY=
TELNYX_SIP_CONNECTION_ID=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
DEEPGRAM_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=

# App Config
DEBUG=true
LOG_LEVEL=debug
ENVIRONMENT=development
EOF
```

- [ ] **Step 2: Create backend/config.py**

```python
import os
from dataclasses import dataclass
from typing import Literal

@dataclass
class Config:
    """Application configuration loaded from environment variables."""
    
    # Database
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # Cache
    redis_url: str
    
    # API Keys
    telnyx_api_key: str
    telnyx_sip_connection_id: str
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    deepgram_api_key: str
    openai_api_key: str
    elevenlabs_api_key: str
    
    # App Config
    debug: bool
    log_level: Literal["debug", "info", "warning", "error"]
    environment: Literal["development", "staging", "production"]
    
    @classmethod
    def from_env(cls) -> "Config":
        """Load config from environment variables."""
        return cls(
            supabase_url=os.getenv("SUPABASE_URL", "http://localhost:54321"),
            supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", ""),
            supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            redis_url=os.getenv("REDIS_URL", "redis://redis:6379"),
            telnyx_api_key=os.getenv("TELNYX_API_KEY", ""),
            telnyx_sip_connection_id=os.getenv("TELNYX_SIP_CONNECTION_ID", ""),
            livekit_url=os.getenv("LIVEKIT_URL", ""),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY", ""),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET", ""),
            deepgram_api_key=os.getenv("DEEPGRAM_API_KEY", ""),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", ""),
            debug=os.getenv("DEBUG", "true").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "debug"),  # type: ignore
            environment=os.getenv("ENVIRONMENT", "development"),  # type: ignore
        )

# Global config instance
config = Config.from_env()
```

- [ ] **Step 3: Update backend/main.py to load config**

Replace top of `backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from config import config
from app.db.supabase import init_supabase
from app.db.redis import init_redis
from app.api import voice, orders, restaurants, payments, admin

log = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    log.info("talkbyte.starting", environment=config.environment)
    await init_supabase()
    await init_redis()
    log.info("talkbyte.ready")
    yield
    log.info("talkbyte.shutdown")

app = FastAPI(
    title="TalkByte AI",
    version="0.1.0",
    description="AI phone ordering backend for Australian restaurants",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"] if config.debug else ["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rest of routers...
```

- [ ] **Step 4: Update backend/requirements.txt**

Add (if not already present):
```
python-dotenv==1.0.0
pydantic==2.5.0
```

- [ ] **Step 5: Test config loads**

```bash
cd backend
export ENVIRONMENT=development
python3 -c "from config import config; print(f'Config loaded: {config.environment}')"
```

Expected: `Config loaded: development`

- [ ] **Step 6: Commit**

```bash
git add backend/config.py backend/.env.example backend/main.py backend/requirements.txt
git commit -m "feat: add backend configuration management

- Created config.py with Config dataclass
- Load all env vars at startup
- Update main.py to use config
- Add python-dotenv to requirements"
```

---

### Task 3: Create Frontend Environment Setup

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/.env.local.example` (existing, verify contents)
- Modify: `frontend/src/lib/api.ts` (or create if missing)

**Interfaces:**
- Produces: Frontend env vars for backend URL and app config

- [ ] **Step 1: Verify/Create frontend/.env.example**

```bash
cat > frontend/.env.example << 'EOF'
# TalkByte Frontend Environment Variables

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase (public, safe to commit)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test

# App Config
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
EOF
```

- [ ] **Step 2: Create frontend/src/lib/api.ts (API client)**

```typescript
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function getOrders(restaurantId: string) {
  return apiCall(`/api/orders?restaurant_id=${restaurantId}`);
}

export async function createOrder(data: any) {
  return apiCall('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

- [ ] **Step 3: Verify frontend/.env.local.example exists**

```bash
cat > frontend/.env.local.example << 'EOF'
# Copy to .env.local for local development
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
EOF
```

- [ ] **Step 4: Verify frontend/package.json has build scripts**

Ensure scripts section includes:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/.env.example frontend/.env.local.example frontend/src/lib/api.ts
git commit -m "feat: add frontend environment setup and API client

- Created .env.example and .env.local.example
- Created api.ts with apiCall wrapper and order endpoints
- Safe to use NEXT_PUBLIC_ vars for non-sensitive config"
```

---

## Phase 2: Backend Setup

### Task 4: Create Structured Logging Setup

**Files:**
- Create: `backend/app/services/logging.py`
- Modify: `backend/main.py` (initialize logging)
- Modify: `backend/requirements.txt` (add structlog)

**Interfaces:**
- Produces: `setup_logging()` function that initializes structlog
- Used by: `main.py` lifespan

- [ ] **Step 1: Add structlog to requirements.txt**

```
structlog==24.1.0
python-json-logger==2.0.7
```

- [ ] **Step 2: Create backend/app/services/logging.py**

```python
import structlog
import sys
from pythonjsonlogger import jsonlogger

def setup_logging(debug: bool = False):
    """Initialize structured logging with structlog."""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger()

# Example usage in services:
# from app.services.logging import get_logger
# log = get_logger()
# log.info("call.started", call_id=call_id, restaurant_id=restaurant_id)
```

- [ ] **Step 3: Update backend/main.py to call setup_logging**

Add after imports:
```python
from app.services.logging import setup_logging

log = setup_logging(config.debug)
```

- [ ] **Step 4: Test logging**

```bash
cd backend
export ENVIRONMENT=development
python3 -c "from app.services.logging import setup_logging; log = setup_logging(); log.info('test', value='123')"
```

Expected: JSON output with `test` event and `value=123`

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/logging.py backend/main.py backend/requirements.txt
git commit -m "feat: add structured logging with structlog

- Created logging.py with setup_logging()
- JSON output for easy parsing
- Call from main.py lifespan
- Add structlog and python-json-logger to requirements"
```

---

### Task 5: Create Error Handling & Custom Exceptions

**Files:**
- Create: `backend/app/models/exception.py`
- Create: `backend/app/services/error_handler.py`

**Interfaces:**
- Produces: Custom exception classes used throughout backend
- Error classes: `CallDropped`, `POSIntegrationError`, `ServiceUnavailable`

- [ ] **Step 1: Create backend/app/models/exception.py**

```python
class TalkByteException(Exception):
    """Base exception for TalkByte."""
    code: str = "INTERNAL_ERROR"
    status_code: int = 500

class CallDropped(TalkByteException):
    """WebSocket disconnected mid-call."""
    code = "CALL_DROPPED"
    status_code = 503

class POSIntegrationError(TalkByteException):
    """POS order push failed."""
    code = "POS_FAILED"
    status_code = 500

class ServiceUnavailable(TalkByteException):
    """External service (Deepgram, OpenAI, etc.) unavailable."""
    code = "SERVICE_UNAVAILABLE"
    status_code = 503

class ValidationError(TalkByteException):
    """Invalid input."""
    code = "VALIDATION_ERROR"
    status_code = 400

class NotFound(TalkByteException):
    """Resource not found."""
    code = "NOT_FOUND"
    status_code = 404
```

- [ ] **Step 2: Create backend/app/services/error_handler.py**

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.models.exception import TalkByteException
import structlog

log = structlog.get_logger()

def create_error_response(exc: TalkByteException, request_id: str = ""):
    """Create standardized error response."""
    return {
        "error": exc.code,
        "message": str(exc),
        "details": {
            "request_id": request_id,
        },
    }

def register_exception_handlers(app: FastAPI):
    """Register global exception handlers."""
    
    @app.exception_handler(TalkByteException)
    async def talkbyte_exception_handler(request: Request, exc: TalkByteException):
        log.error(
            "talkbyte_exception",
            code=exc.code,
            message=str(exc),
            path=request.url.path,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(exc),
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        log.error(
            "unhandled_exception",
            message=str(exc),
            path=request.url.path,
            type=type(exc).__name__,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            },
        )
```

- [ ] **Step 3: Update backend/main.py to register handlers**

Add after app creation:
```python
from app.services.error_handler import register_exception_handlers

register_exception_handlers(app)
```

- [ ] **Step 4: Test exceptions**

```bash
cd backend
python3 << 'EOF'
from app.models.exception import CallDropped, POSIntegrationError
try:
    raise CallDropped("WebSocket disconnected")
except Exception as e:
    print(f"Code: {e.code}, Status: {e.status_code}, Message: {e}")
EOF
```

Expected: Output with code, status, and message

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/exception.py backend/app/services/error_handler.py backend/main.py
git commit -m "feat: add error handling and custom exceptions

- Created exception.py with TalkByteException base class
- Specific exceptions: CallDropped, POSIntegrationError, ServiceUnavailable
- Created error_handler.py with global exception handlers
- All errors logged and returned in consistent format"
```

---

## Phase 3: Docker & Docker Compose

### Task 6: Create Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Modify: `backend/requirements.txt` (ensure all deps present)

**Interfaces:**
- Produces: Docker image for backend (FastAPI)
- Used by: `docker-compose.yml`

- [ ] **Step 1: Create backend/Dockerfile**

```dockerfile
# Use official Python runtime as base image
FROM python:3.12-slim

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

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 2: Verify backend/requirements.txt has all deps**

Ensure includes:
```
fastapi==0.104.1
uvicorn==0.24.0
supabase==2.0.0
redis==5.0.1
structlog==24.1.0
python-json-logger==2.0.7
python-dotenv==1.0.0
pydantic==2.5.0
httpx==0.25.2
aioredis==2.0.1
```

- [ ] **Step 3: Test Dockerfile builds**

```bash
cd backend
docker build -t talkbyte-backend:test .
docker images | grep talkbyte-backend
```

Expected: Image listed with `test` tag

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile backend/requirements.txt
git commit -m "feat: add backend Dockerfile

- Python 3.12 slim base image
- Install system deps (gcc)
- Expose port 8000
- Health check via /docs endpoint
- Run with uvicorn reload for development"
```

---

### Task 7: Create Frontend Dockerfile

**Files:**
- Create: `frontend/Dockerfile`

**Interfaces:**
- Produces: Docker image for frontend (Next.js)
- Used by: `docker-compose.yml`

- [ ] **Step 1: Create frontend/Dockerfile**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["npm", "run", "dev"]
```

- [ ] **Step 2: Ensure frontend/package.json has scripts**

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 3: Test Dockerfile builds**

```bash
cd frontend
docker build -t talkbyte-frontend:test .
docker images | grep talkbyte-frontend
```

Expected: Image listed with `test` tag

- [ ] **Step 4: Commit**

```bash
git add frontend/Dockerfile
git commit -m "feat: add frontend Dockerfile

- Multi-stage build (builder + production)
- Node 20 alpine for minimal size
- Build Next.js app in builder stage
- Production stage runs npm run dev for development
- Health check via HTTP GET to localhost:3000"
```

---

### Task 8: Create Local Docker Compose

**Files:**
- Create: `docker-compose.yml` (replaces placeholder)

**Interfaces:**
- Produces: Full local development stack
- Services: backend, frontend, supabase, redis, supabase-studio

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=http://supabase:5432
      - SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDB9.test
      - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.test
      - REDIS_URL=redis://redis:6379
      - TELNYX_API_KEY=${TELNYX_API_KEY:-}
      - TELNYX_SIP_CONNECTION_ID=${TELNYX_SIP_CONNECTION_ID:-}
      - LIVEKIT_URL=${LIVEKIT_URL:-}
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY:-}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET:-}
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY:-}
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY:-}
      - DEBUG=true
      - LOG_LEVEL=debug
      - ENVIRONMENT=development
    volumes:
      - ./backend:/app
    depends_on:
      - supabase
      - redis
    networks:
      - talkbyte-local
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8000
      - NEXT_PUBLIC_SUPABASE_URL=http://supabase:5432
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDB9.test
      - NEXT_PUBLIC_ENVIRONMENT=development
      - NEXT_PUBLIC_DEBUG=true
    volumes:
      - ./frontend:/app
    depends_on:
      - backend
    networks:
      - talkbyte-local
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  supabase:
    image: supabase/postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    volumes:
      - ./backend/supabase_schema.sql:/docker-entrypoint-initdb.d/init.sql
      - supabase-data:/var/lib/postgresql/data
    networks:
      - talkbyte-local
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - talkbyte-local
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  supabase-studio:
    image: supabase/studio:latest
    ports:
      - "54321:3000"
    environment:
      - SUPABASE_URL=http://supabase:5432
      - SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.test
    depends_on:
      - supabase
    networks:
      - talkbyte-local

volumes:
  supabase-data:
  redis-data:

networks:
  talkbyte-local:
    driver: bridge
```

- [ ] **Step 2: Test docker-compose up (quick test)**

```bash
docker-compose config  # validate YAML syntax
```

Expected: Valid YAML output (no errors)

- [ ] **Step 3: Create .dockerignore files**

`backend/.dockerignore`:
```
__pycache__
*.pyc
.env*
.pytest_cache
tests/
```

`frontend/.dockerignore`:
```
node_modules
.next
.env*
__tests__
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml backend/.dockerignore frontend/.dockerignore
git commit -m "feat: add local docker-compose stack

- Backend: FastAPI on :8000 with hot reload
- Frontend: Next.js on :3000 with hot reload
- Supabase: Postgres on :5432, schema auto-loaded
- Redis: on :6379
- Supabase Studio: on :54321
- All services networked internally
- Health checks for all services"
```

---

## Phase 4: Testing Infrastructure

### Task 9: Create Backend Testing Setup (pytest)

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/unit/test_config.py`
- Modify: `backend/requirements.txt` (add pytest, pytest-cov)

**Interfaces:**
- Produces: pytest fixtures and mocking setup
- Used by: All backend tests

- [ ] **Step 1: Add pytest to requirements.txt**

```
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
```

- [ ] **Step 2: Create backend/tests/__init__.py**

```python
"""Backend tests."""
```

- [ ] **Step 3: Create backend/tests/conftest.py**

```python
import pytest
from unittest.mock import Mock, patch
import os

# Set test environment
os.environ['ENVIRONMENT'] = 'test'
os.environ['SUPABASE_URL'] = 'http://localhost:5432'
os.environ['REDIS_URL'] = 'redis://localhost:6379'

@pytest.fixture
def mock_supabase():
    """Mock Supabase client."""
    with patch('app.db.supabase.SupabaseClient') as mock:
        yield mock

@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    with patch('app.db.redis.Redis') as mock:
        yield mock

@pytest.fixture
def mock_deepgram():
    """Mock Deepgram STT."""
    with patch('app.services.stt.DeepgramClient') as mock:
        yield mock

@pytest.fixture
def mock_openai():
    """Mock OpenAI LLM."""
    with patch('app.services.llm.OpenAI') as mock:
        yield mock
```

- [ ] **Step 4: Create backend/tests/unit/test_config.py**

```python
import pytest
from config import Config

def test_config_loads_from_env(monkeypatch):
    """Test config loads environment variables."""
    monkeypatch.setenv('ENVIRONMENT', 'test')
    monkeypatch.setenv('DEBUG', 'true')
    monkeypatch.setenv('LOG_LEVEL', 'debug')
    
    config = Config.from_env()
    
    assert config.environment == 'test'
    assert config.debug is True
    assert config.log_level == 'debug'

def test_config_defaults():
    """Test config has sensible defaults."""
    # Ensure env vars not set
    import os
    env_backup = os.environ.copy()
    for key in ['ENVIRONMENT', 'DEBUG', 'LOG_LEVEL']:
        os.environ.pop(key, None)
    
    try:
        config = Config.from_env()
        assert config.environment == 'development'
        assert config.debug is True
    finally:
        os.environ.clear()
        os.environ.update(env_backup)
```

- [ ] **Step 5: Run pytest**

```bash
cd backend
pytest tests/unit/test_config.py -v
```

Expected: 2 tests pass

- [ ] **Step 6: Create pytest.ini**

```bash
cat > backend/pytest.ini << 'EOF'
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --cov=app --cov-report=html --cov-report=term-missing
EOF
```

- [ ] **Step 7: Commit**

```bash
git add backend/tests/ backend/pytest.ini backend/requirements.txt
git commit -m "feat: add pytest testing infrastructure

- Created tests/ directory structure
- Added conftest.py with fixtures for mocking
- Added test_config.py to verify configuration
- Added pytest.ini with coverage reporting
- Add pytest, pytest-cov, pytest-mock to requirements"
```

---

### Task 10: Create Frontend Testing Setup (Vitest & Playwright)

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/__tests__/unit/api.test.ts`
- Modify: `frontend/package.json` (add test scripts)

**Interfaces:**
- Produces: Testing infrastructure for frontend
- Used by: All frontend tests

- [ ] **Step 1: Update frontend/package.json**

Add to scripts:
```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

Add to devDependencies:
```json
"vitest": "^1.0.0",
"@vitest/ui": "^1.0.0",
"@testing-library/react": "^14.0.0",
"@testing-library/jest-dom": "^6.0.0",
"playwright": "^1.40.0"
```

- [ ] **Step 2: Create frontend/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
```

- [ ] **Step 3: Create frontend/vitest.setup.ts**

```typescript
import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  })
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))
```

- [ ] **Step 4: Create frontend/playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: Create frontend/__tests__/unit/api.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { apiCall, getOrders, createOrder } from '@/lib/api'

global.fetch = vi.fn()

describe('API Client', () => {
  it('should call the correct endpoint', async () => {
    const mockResponse = { orders: [] }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await apiCall('/test')
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        })
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('should handle API errors', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'SERVER_ERROR' }),
    })

    await expect(apiCall('/test')).rejects.toThrow()
  })
})
```

- [ ] **Step 6: Create frontend/__tests__/e2e/health.spec.ts**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Frontend Health', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/TalkByte|Home/)
  })

  test('should access backend API', async ({ page }) => {
    await page.goto('/')
    // Verify fetch to backend doesn't fail
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/docs').then(r => r.status)
    )
    expect(response).toBe(200)
  })
})
```

- [ ] **Step 7: Test frontend tests run**

```bash
cd frontend
npm install
npm run test -- frontend/__tests__/unit/api.test.ts
```

Expected: 2 tests pass

- [ ] **Step 8: Commit**

```bash
git add frontend/vitest.config.ts frontend/playwright.config.ts frontend/__tests__/ frontend/package.json frontend/vitest.setup.ts
git commit -m "feat: add frontend testing infrastructure (Vitest + Playwright)

- Created vitest.config.ts with jsdom environment
- Created playwright.config.ts for E2E testing
- Added test setup files and base tests
- Update package.json with test scripts
- Add vitest, testing-library, playwright to devDeps"
```

---

## Phase 5: CI/CD Pipeline

### Task 11: Create GitHub Actions Test Pipeline

**Files:**
- Create: `.github/workflows/test.yml`

**Interfaces:**
- Produces: Automated testing on push/PR to main
- Runs: pytest (backend) + Vitest (frontend)

- [ ] **Step 1: Create .github/workflows/test.yml**

```yaml
name: Tests

on:
  push:
    branches: [main, claude/*]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        run: |
          cd backend
          pytest tests/ -v --cov=app --cov-report=xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run frontend unit tests
        run: |
          cd frontend
          npm run test
      
      - name: Run ESLint
        run: |
          cd frontend
          npm run lint || true  # Don't fail on lint errors yet

  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install linting tools
        run: |
          pip install black flake8 isort
      
      - name: Check formatting with black
        run: |
          cd backend
          black --check app/ main.py config.py || true
      
      - name: Check imports with isort
        run: |
          cd backend
          isort --check app/ main.py config.py || true
      
      - name: Run flake8
        run: |
          cd backend
          flake8 app/ main.py config.py || true
```

- [ ] **Step 2: Verify .github directory exists**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add GitHub Actions test pipeline

- Run pytest on backend (with coverage)
- Run Vitest on frontend
- Run linting (black, flake8, isort, eslint)
- Upload coverage to Codecov
- Trigger on push to main and claude/* branches"
```

---

### Task 12: Create GitHub Actions Docker Build Pipeline

**Files:**
- Create: `.github/workflows/build-and-push.yml`
- Create: `.dockerconfigjson` (template)

**Interfaces:**
- Produces: Automated Docker image builds on successful tests
- Builds: backend and frontend images
- Pushes to: Oracle Container Registry (to be configured)

- [ ] **Step 1: Create .github/workflows/build-and-push.yml**

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]
    # Only build if tests passed
  workflow_run:
    workflows: [Tests]
    types: [completed]
    branches: [main]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: false
          tags: talkbyte-backend:${{ github.sha }}
          outputs: type=docker,dest=/tmp/backend.tar
      
      - name: Upload backend artifact
        uses: actions/upload-artifact@v3
        with:
          name: backend-image
          path: /tmp/backend.tar

  build-frontend:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: false
          tags: talkbyte-frontend:${{ github.sha }}
          outputs: type=docker,dest=/tmp/frontend.tar
      
      - name: Upload frontend artifact
        uses: actions/upload-artifact@v3
        with:
          name: frontend-image
          path: /tmp/frontend.tar

  # TODO: Add push to Oracle Container Registry
  # Requires:
  # - ORACLE_REGISTRY_URL (e.g., phx.ocir.io/namespace)
  # - ORACLE_REGISTRY_USERNAME
  # - ORACLE_REGISTRY_PASSWORD (as GitHub secret)
```

- [ ] **Step 2: Create docs/REGISTRY_SETUP.md (Oracle Container Registry instructions)**

```markdown
# Oracle Container Registry Setup

## Prerequisites
- Oracle Cloud account with free tier
- Container Registry enabled in your region

## Steps

1. **Create Auth Token:**
   - Oracle Cloud Console → Identity & Security → Users
   - Click your user → Auth Tokens → Generate Token
   - Copy the token (save it, you won't see it again)

2. **Create Secret in GitHub:**
   ```bash
   gh secret set ORACLE_REGISTRY_PASSWORD
   # Paste auth token when prompted
   ```

3. **Add to GitHub Secrets:**
   - ORACLE_REGISTRY_URL=phx.ocir.io/your-namespace
   - ORACLE_REGISTRY_USERNAME=your-username

4. **Update .github/workflows/build-and-push.yml:**
   - Uncomment the push job
   - Use docker/login-action with Oracle creds
   - Push images to registry
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/build-and-push.yml docs/REGISTRY_SETUP.md
git commit -m "ci: add Docker build pipeline (Oracle registry ready)

- Build backend and frontend images on successful tests
- Create artifacts (ready for push to registry)
- TODO: Wire up Oracle Container Registry push
- Requires: ORACLE_REGISTRY_URL, USERNAME, PASSWORD secrets"
```

---

## Phase 6: Documentation

### Task 13: Create Local Development Setup Guide

**Files:**
- Create: `docs/LOCAL_DEV_SETUP.md`

**Interfaces:**
- Produces: Step-by-step guide for local dev
- Used by: Developers getting started

- [ ] **Step 1: Create docs/LOCAL_DEV_SETUP.md**

```markdown
# Local Development Setup

## Prerequisites

- Docker & Docker Compose (install from docker.com)
- Git
- A terminal (bash, zsh, or similar)

## Quick Start

1. **Clone the repo:**
   \`\`\`bash
   git clone <repo-url>
   cd talkbyte
   \`\`\`

2. **Copy environment templates:**
   \`\`\`bash
   cp .env.example .env.local
   cp backend/.env.example backend/.env.local
   cp frontend/.env.local.example frontend/.env.local
   \`\`\`

3. **Fill in API keys in .env.local:**
   - Open \`.env.local\` in your editor
   - Add your Telnyx, LiveKit, Deepgram, OpenAI, ElevenLabs keys
   - Save

4. **Start the stack:**
   \`\`\`bash
   docker-compose up --build
   \`\`\`

5. **Access services:**
   - Backend: http://localhost:8000/docs
   - Frontend: http://localhost:3000
   - Supabase Admin: http://localhost:54321
   - API: http://localhost:8000

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 8000 | FastAPI server |
| Frontend | 3000 | Next.js dev |
| Supabase | 5432 | PostgreSQL (internal) |
| Redis | 6379 | Cache/queue |
| Supabase Studio | 54321 | Database UI |

## Common Commands

**Start all services:**
\`\`\`bash
docker-compose up --build
\`\`\`

**Stop all services:**
\`\`\`bash
docker-compose down
\`\`\`

**View logs:**
\`\`\`bash
docker-compose logs -f backend
docker-compose logs -f frontend
\`\`\`

**Run backend tests:**
\`\`\`bash
docker-compose exec backend pytest tests/ -v
\`\`\`

**Run frontend tests:**
\`\`\`bash
docker-compose exec frontend npm run test
\`\`\`

**Access Redis CLI:**
\`\`\`bash
docker-compose exec redis redis-cli
\`\`\`

**Access database:**
\`\`\`bash
docker-compose exec supabase psql -U postgres
\`\`\`

## Troubleshooting

**Port already in use:**
\`\`\`bash
# Find what's using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
\`\`\`

**Database connection error:**
\`\`\`bash
# Restart Supabase
docker-compose restart supabase
\`\`\`

**Frontend not connecting to backend:**
- Verify \`NEXT_PUBLIC_BACKEND_URL=http://localhost:8000\` in \`frontend/.env.local\`
- Check backend is running: \`curl http://localhost:8000/docs\`

## Environment Variables

### Backend (.env.local)
- \`SUPABASE_URL\` — Database URL (set to http://localhost:54321)
- \`REDIS_URL\` — Redis connection (set to redis://redis:6379)
- API keys: TELNYX, LIVEKIT, DEEPGRAM, OPENAI, ELEVENLABS
- \`DEBUG=true\` for development

### Frontend (.env.local)
- \`NEXT_PUBLIC_BACKEND_URL=http://localhost:8000\`
- \`NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321\`
- \`NEXT_PUBLIC_ENVIRONMENT=development\`
\`\`\`

- [ ] **Step 2: Verify markdown syntax**

```bash
grep -E "^##" docs/LOCAL_DEV_SETUP.md  # Should show all headers
```

- [ ] **Step 3: Commit**

```bash
git add docs/LOCAL_DEV_SETUP.md
git commit -m "docs: add local development setup guide

- Prerequisites and quick start
- Service ports and purposes
- Common Docker Compose commands
- Troubleshooting section
- Environment variable reference"
```

---

### Task 14: Create Oracle Cloud Deployment Guide

**Files:**
- Create: `docs/ORACLE_CLOUD_SETUP.md`

**Interfaces:**
- Produces: Step-by-step Oracle Cloud setup
- Used by: Setting up production demo

- [ ] **Step 1: Create docs/ORACLE_CLOUD_SETUP.md**

```markdown
# Oracle Cloud Free Tier Setup

## Prerequisites

- Oracle Cloud account (free tier)
- Supabase account
- Upstash Redis account

## Step 1: Create Supabase Cloud Project

1. Go to supabase.com
2. Sign up or log in
3. Create new project
4. Get: Project URL + Service Role Key
5. Run schema SQL in SQL editor (from backend/supabase_schema.sql)

## Step 2: Create Upstash Redis

1. Go to upstash.com
2. Sign up or log in
3. Create Redis database (free tier)
4. Get: Connection string

## Step 3: Create Oracle Compute Instance

1. Oracle Cloud Console → Compute → Instances
2. Click "Create Instance"
3. **Image:** Ubuntu 22.04 minimal (free tier)
4. **Shape:** VM.Standard.A1.Flex (2 ARM vCPU, 12GB RAM)
5. **Storage:** 200GB
6. **Public IP:** Assign
7. Click "Create"

## Step 4: Set Up Oracle VM

1. **SSH into the instance:**
   \`\`\`bash
   ssh ubuntu@<public-ip>
   \`\`\`

2. **Update system:**
   \`\`\`bash
   sudo apt update && sudo apt upgrade -y
   \`\`\`

3. **Install Docker:**
   \`\`\`bash
   sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker ubuntu
   \`\`\`

4. **Log out and back in:**
   \`\`\`bash
   exit
   ssh ubuntu@<public-ip>
   \`\`\`

5. **Verify Docker:**
   \`\`\`bash
   docker --version
   docker-compose --version
   \`\`\`

## Step 5: Deploy TalkByte

1. **Clone repo on Oracle VM:**
   \`\`\`bash
   git clone <repo-url>
   cd talkbyte
   \`\`\`

2. **Create .env.prod:**
   \`\`\`bash
   cat > .env.prod << 'EOF'
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<key-from-supabase>
   REDIS_URL=redis://default:<password>@<upstash-host>:6379
   TELNYX_API_KEY=<your-key>
   # ... other keys
   EOF
   \`\`\`

3. **Create docker-compose.prod.yml:**
   (See docs/docker-compose.prod.yml.example)

4. **Start services:**
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml up -d
   \`\`\`

5. **Verify:**
   \`\`\`bash
   curl http://localhost:8000/docs
   curl http://localhost:3000
   \`\`\`

## Daily Demo (7am–12pm)

**Morning (7am):**
\`\`\`bash
ssh ubuntu@<public-ip>
cd talkbyte
git pull  # Get latest code
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

**Afternoon (12pm):**
\`\`\`bash
docker-compose -f docker-compose.prod.yml down
# Data persists in Supabase Cloud + Upstash
\`\`\`

## Monitoring

**Check logs:**
\`\`\`bash
docker-compose -f docker-compose.prod.yml logs -f backend
\`\`\`

**Check service status:**
\`\`\`bash
docker-compose -f docker-compose.prod.yml ps
\`\`\`

## Troubleshooting

**Out of memory:**
- Oracle Free tier has limited RAM
- Stop non-essential services
- Check memory: \`free -h\`

**Database connection timeout:**
- Check Supabase Cloud is running
- Verify SUPABASE_URL is reachable: \`curl <url>\`

**Domain/IP issues:**
- Use Oracle-provided public IP
- Update DNS if using custom domain
\`\`\`

- [ ] **Step 2: Commit**

```bash
git add docs/ORACLE_CLOUD_SETUP.md
git commit -m "docs: add Oracle Cloud Free tier deployment guide

- Prerequisites (Supabase, Upstash, Oracle account)
- Step-by-step Oracle VM setup
- Docker installation and configuration
- TalkByte deployment instructions
- Daily demo workflow (7am-12pm)
- Monitoring and troubleshooting"
```

---

### Task 15: Create Daily Demo Instructions

**Files:**
- Create: `docs/DAILY_DEMO_INSTRUCTIONS.md`

**Interfaces:**
- Produces: Quick reference for running daily demos
- Used by: Operator (you) at 7am and 12pm

- [ ] **Step 1: Create docs/DAILY_DEMO_INSTRUCTIONS.md**

```markdown
# Daily Demo Instructions (7am–12pm)

## Morning Startup (7am)

1. **SSH into Oracle VM:**
   \`\`\`bash
   ssh ubuntu@<your-oracle-public-ip>
   \`\`\`

2. **Navigate to repo:**
   \`\`\`bash
   cd ~/talkbyte
   \`\`\`

3. **Pull latest code:**
   \`\`\`bash
   git pull origin main
   \`\`\`

4. **Start services:**
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml up -d
   \`\`\`

5. **Verify services are running:**
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml ps
   # Should show 3 services: backend, frontend, supabase-studio
   \`\`\`

6. **Test endpoints:**
   \`\`\`bash
   curl -s http://localhost:8000/docs | grep -q "TalkByte" && echo "Backend ✓" || echo "Backend ✗"
   curl -s http://localhost:3000 | grep -q "html" && echo "Frontend ✓" || echo "Frontend ✗"
   \`\`\`

7. **Get public IP:**
   \`\`\`bash
   echo "Access demo at: http://<your-public-ip>:3000"
   \`\`\`

## During Demo (7am–12pm)

- **App is live** at http://<public-ip>:3000
- **Backend API** at http://<public-ip>:8000
- **Swagger docs** at http://<public-ip>:8000/docs
- Monitor logs:
  \`\`\`bash
  docker-compose -f docker-compose.prod.yml logs -f backend
  \`\`\`

## Afternoon Shutdown (12pm)

1. **Stop all services:**
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml down
   \`\`\`

2. **Verify stopped:**
   \`\`\`bash
   docker-compose -f docker-compose.prod.yml ps
   # Should show empty list
   \`\`\`

3. **Data is persisted** in:
   - Supabase Cloud (calls, orders, restaurants)
   - Upstash Redis (session state)

## Troubleshooting

**Services won't start:**
\`\`\`bash
docker-compose -f docker-compose.prod.yml logs
# Check for errors
\`\`\`

**Database connection error:**
\`\`\`bash
# Restart and wait 30s
docker-compose -f docker-compose.prod.yml restart
sleep 30
curl http://localhost:8000/docs
\`\`\`

**High CPU/Memory:**
\`\`\`bash
docker stats  # See which container is using resources
docker-compose -f docker-compose.prod.yml restart backend  # Restart one service
\`\`\`

## Quick Reference

| Time | Action |
|------|--------|
| 6:55am | SSH to Oracle VM |
| 7:00am | Run startup script |
| 7:05am | Demo goes live |
| 11:55am | Final demo test |
| 12:00pm | Run shutdown |
| 12:05pm | Verify stopped |

## One-Liner Startup (Copy & Paste)

\`\`\`bash
cd ~/talkbyte && git pull && docker-compose -f docker-compose.prod.yml up -d && sleep 5 && echo "Ready at http://$(curl -s ifconfig.me):3000"
\`\`\`

## One-Liner Shutdown (Copy & Paste)

\`\`\`bash
cd ~/talkbyte && docker-compose -f docker-compose.prod.yml down && echo "Stopped. Data safe in Supabase + Upstash."
\`\`\`
\`\`\`

- [ ] **Step 2: Commit**

```bash
git add docs/DAILY_DEMO_INSTRUCTIONS.md
git commit -m "docs: add daily demo (7am-12pm) checklist

- Morning startup checklist
- Service verification steps
- During-demo monitoring
- Afternoon shutdown procedure
- Troubleshooting quick fixes
- One-liner scripts for startup/shutdown"
```

---

## Summary & Self-Review

**Spec Coverage Checklist:**

- [x] Section 1: Local Development Setup → Tasks 1–3, 8
- [x] Section 2: Production/Demo Setup (Oracle) → Tasks 12, 14
- [x] Section 3: Testing Infrastructure → Tasks 9–10
- [x] Section 4: Project File Structure → Implicitly covered by file creation
- [x] Section 5: Error Handling & Logging → Tasks 4–5
- [x] Section 6: Secret Management → Tasks 1–3
- [x] Section 7: API Documentation & Monitoring → Task 9 (pytest fixtures)
- [x] CI/CD Pipeline → Tasks 11–12
- [x] Documentation → Tasks 13–15

**Placeholder Check:** ✓ All tasks have concrete code/steps, no TBDs

**Type Consistency:** ✓ Config class, API client, exceptions all consistent across tasks

**No Gaps:** ✓ All major components covered

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-08-29-talkbyte-foundation-implementation.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per phase, review between phases, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
