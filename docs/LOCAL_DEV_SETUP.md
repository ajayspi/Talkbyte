# Local Development Setup — TalkByte AI

This guide walks you through running the entire TalkByte AI phone ordering system on your local machine using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 Steps)](#quick-start-5-steps)
3. [Environment Setup](#environment-setup)
4. [Running Services](#running-services)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

### Required Software

- **Docker** (version 24.0 or later)
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version`

- **Docker Compose** (usually bundled with Docker Desktop)
  - Verify: `docker-compose --version`

- **Git**
  - Download: https://git-scm.com
  - Verify: `git --version`

- **Node.js** 20+ (optional, only if running frontend outside Docker)
  - Download: https://nodejs.org
  - Verify: `node --version` and `npm --version`

- **Python 3.12+** (optional, only if running backend outside Docker)
  - Download: https://www.python.org
  - Verify: `python3 --version`

### System Requirements

- **RAM:** Minimum 4GB (8GB recommended for smooth operation)
- **Disk space:** At least 5GB free (for Docker images and volumes)
- **Ports:** Ensure the following are available on your machine:
  - 3000 (frontend)
  - 8000 (backend API)
  - 5432 (PostgreSQL database)
  - 6379 (Redis cache)
  - 54321 (Supabase Studio UI)

### Optional: API Keys for Third-Party Services

These are not required to run the local stack, but you'll need them for voice features to work. You can start without them and fill in later:

- Telnyx API key: https://portal.telnyx.com
- LiveKit Cloud account: https://cloud.livekit.io
- Deepgram API key: https://console.deepgram.com
- OpenAI API key: https://platform.openai.com/api-keys
- ElevenLabs API key: https://elevenlabs.io
- Stripe API key (test mode): https://dashboard.stripe.com

---

## Quick Start (5 Steps)

### Step 1: Clone the Repository

```bash
git clone https://github.com/[REPLACE_WITH_ORG]/talkbyte.git
cd talkbyte
```

> **Note:** Replace `[REPLACE_WITH_ORG]` with your actual GitHub organization name. For example, if your organization is `acme-restaurants`, use: `https://github.com/acme-restaurants/talkbyte.git`

### Step 2: Create Environment File

Copy the example environment file and modify with your credentials (or leave as-is for local testing):

```bash
cp .env.example .env.local
```

For local development with Docker Compose, the environment file will use the example values. However, if you want to test voice features:

1. Open `.env.local` in your text editor
2. Fill in the API keys you obtained from the services above
3. Keep other values as-is for local development

### Step 3: Start All Services with Docker Compose

```bash
docker-compose up
```

This command will:
- Build Docker images for backend and frontend
- Start PostgreSQL database (Supabase)
- Start Redis cache
- Start FastAPI backend server
- Start Next.js frontend server
- Start Supabase Studio (database UI)

Wait for all services to report "healthy" (typically 30–60 seconds).

Expected output at the end:
```
backend  | INFO:     Uvicorn running on http://0.0.0.0:8000
frontend | ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 4: Verify All Services Are Running

Open your browser and check each service:

| Service | URL | Expected |
|---------|-----|----------|
| Frontend | http://localhost:3000 | TalkByte UI loads |
| Backend API Docs | http://localhost:8000/docs | FastAPI Swagger documentation |
| Supabase Studio | http://localhost:54321 | Database management UI |

### Step 5: (Optional) Load Sample Data

Create test data for development. Choose one method:

**Method A: Using Supabase Studio (Recommended for first-time setup)**

1. Open Supabase Studio: http://localhost:54321
2. Navigate to the **SQL Editor**
3. Run the schema file to initialize tables:
   ```sql
   -- This is already done automatically, but you can verify tables exist:
   SELECT table_name FROM information_schema.tables WHERE table_schema='public';
   ```
4. Insert test restaurant:
   ```sql
   INSERT INTO restaurants (name, phone_number, ai_instructions, active)
   VALUES ('Test Cafe', '+61412345678', 'Be friendly and professional', true);
   ```

**Method B: Using curl commands (for automation)**

```bash
# Get the restaurant creation endpoint
curl -X POST http://localhost:8000/api/v1/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cafe",
    "phone_number": "+61412345678",
    "ai_instructions": "Be friendly and professional"
  }'
```

**Method C: Using Swagger UI (Visual approach)**

1. Open http://localhost:8000/docs
2. Click on **POST /api/v1/restaurants**
3. Click **Try it out**
4. Enter example data:
   ```json
   {
     "name": "Test Cafe",
     "phone_number": "+61412345678",
     "ai_instructions": "Be friendly and professional"
   }
   ```
5. Click **Execute**

---

## Environment Setup

### .env.local File Structure

Your `.env.local` file controls configuration for local development. Here's what each section means:

#### Core Application Settings

```
ENVIRONMENT=development          # Keep as 'development' for local work
DEBUG=true                        # Enable debug logging
LOG_LEVEL=debug                   # Show all logs (debug, info, warning, error)
```

#### Database (Supabase / PostgreSQL)

For local development, these are pre-configured in `docker-compose.yml`:

```
SUPABASE_URL=http://supabase:5432           # Docker network reference
SUPABASE_ANON_KEY=eyJhbGc...                # Test JWT token (don't change)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...        # Service role token (don't change)
```

#### Redis Cache

```
REDIS_URL=redis://redis:6379               # Docker network reference
```

#### Voice Services (Required for Phone Features)

Fill these in only if you want to test call handling:

```
TELNYX_API_KEY=your-key-here               # From https://portal.telnyx.com
TELNYX_SIP_CONNECTION_ID=your-id-here      # SIP trunk connection ID
LIVEKIT_URL=ws://localhost:7880             # Change if using cloud LiveKit
LIVEKIT_API_KEY=your-key-here
LIVEKIT_API_SECRET=your-secret-here
DEEPGRAM_API_KEY=your-key-here             # From https://console.deepgram.com
OPENAI_API_KEY=sk-your-key-here            # From https://platform.openai.com
ELEVENLABS_API_KEY=your-key-here           # From https://elevenlabs.io
```

#### Payment Services (Optional)

```
STRIPE_SECRET_KEY=sk_test_your-key         # Test mode key from Stripe
STRIPE_WEBHOOK_SECRET=whsec_your-key       # Webhook signing key
SQUARE_APPLICATION_ID=sq0idp-your-id       # Square sandbox credentials
SQUARE_APPLICATION_SECRET=your-secret
```

---

## Running Services

### Start All Services

```bash
docker-compose up
```

This starts all services and logs to your terminal. Services will auto-reload when code changes.

### Start in Background

```bash
docker-compose up -d
```

Then view logs with:

```bash
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Backend only
docker-compose logs -f frontend           # Frontend only
docker-compose logs -f supabase           # Database only
```

### Stop All Services

```bash
docker-compose down
```

This stops and removes all running containers but preserves data in volumes.

### Stop and Remove All Data

```bash
docker-compose down -v
```

Warning: This deletes all database and cache data. Use only when you want a fresh start.

### Access Service UIs

#### Backend API Documentation
- **URL:** http://localhost:8000/docs
- **Type:** Interactive Swagger UI
- **Use:** Test API endpoints, view schemas, run requests

#### Backend Health Check
- **URL:** http://localhost:8000/health
- **Type:** JSON response
- **Expected:** `{"status": "healthy"}`

#### Frontend Application
- **URL:** http://localhost:3000
- **Type:** Next.js app
- **Use:** Restaurant dashboard, admin panel

#### Supabase Studio (Database UI)
- **URL:** http://localhost:54321
- **Type:** Database management UI
- **Credentials:** (none required for local)
- **Use:** View tables, edit data, run SQL queries, manage auth

#### Redis CLI (via Docker)

To inspect or debug the cache:

```bash
docker-compose exec redis redis-cli
```

Then try commands like:
```
PING                          # Test connection
KEYS *                        # List all keys
GET key-name                  # Get a value
FLUSHALL                      # Clear all data (use with caution!)
```

Type `exit` to quit.

---

## Testing

### Backend Tests (Python / pytest)

Run all backend tests:

```bash
docker-compose exec backend pytest
```

Run tests with coverage report:

```bash
docker-compose exec backend pytest --cov=app --cov-report=html
```

View the coverage report (opens in default browser if you have a local HTTP server):
```bash
# The report is at: backend/htmlcov/index.html
```

Run specific test file:

```bash
docker-compose exec backend pytest tests/test_orders.py -v
```

Run tests matching a pattern:

```bash
docker-compose exec backend pytest -k "payment" -v
```

### Frontend Tests (JavaScript / Jest)

Run all frontend tests:

```bash
docker-compose exec frontend npm test
```

Run frontend tests in watch mode (re-run on file changes):

```bash
docker-compose exec frontend npm test -- --watch
```

Run frontend tests with coverage:

```bash
docker-compose exec frontend npm test -- --coverage
```

### Linting

Check code style (backend):

```bash
docker-compose exec backend flake8 app/
```

Check code style (frontend):

```bash
docker-compose exec frontend npm run lint
```

### Manual API Testing

Use `curl` or a tool like Postman/Insomnia to test endpoints:

```bash
# Test backend health
curl http://localhost:8000/health

# Get API documentation
curl http://localhost:8000/openapi.json

# Create a restaurant (example)
curl -X POST http://localhost:8000/api/v1/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Cafe", "phone_number": "+61412345678"}'
```

---

## Troubleshooting

### Port Conflicts

If you get an error like `bind: address already in use`:

**Problem:** Another application is using a port.

**Solution 1 — Stop the conflicting service:**

```bash
# macOS/Linux
lsof -i :3000          # Check what's using port 3000
kill -9 <PID>          # Kill the process

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

**Solution 2 — Change Docker Compose ports:**

Edit `docker-compose.yml` and change port mappings (e.g., `"3001:3000"` for frontend).

### Docker Build Failures

**Problem:** `docker-compose up` fails with build errors.

**Solution:**

```bash
# Clean up Docker images and try again
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Service Doesn't Start / Healthcheck Fails

**Problem:** Service is stuck on `starting` or shows unhealthy.

**Solution:**

```bash
# Check service logs
docker-compose logs backend    # For backend
docker-compose logs frontend   # For frontend

# Wait longer (some services take >30s to start)
docker-compose logs -f --tail=50 backend
```

If logs show connection errors, the service may be waiting for dependencies. Try stopping and restarting:

```bash
docker-compose down
docker-compose up --no-cache
```

### Database Connection Errors

**Problem:** Backend can't connect to PostgreSQL.

**Solution:**

```bash
# Check if supabase service is running
docker-compose ps supabase

# If not, restart the stack
docker-compose down
docker-compose up
```

Wait for the supabase service to report healthy (check with `docker-compose ps`).

### Redis Connection Errors

**Problem:** Backend errors mention Redis/cache issues.

**Solution:**

```bash
# Verify Redis is running
docker-compose ps redis

# Flush the cache and restart
docker-compose down
docker-compose up
```

### Hot Reload Not Working

**Problem:** Code changes in backend/frontend don't reflect in running container.

**Solution:**

1. Verify volume mounts in `docker-compose.yml` include your file paths:
   ```yaml
   volumes:
     - ./backend:/app        # Backend code
     - ./frontend:/app       # Frontend code
   ```

2. Restart the service:
   ```bash
   docker-compose restart backend
   docker-compose restart frontend
   ```

3. If still not working, restart the full stack:
   ```bash
   docker-compose down
   docker-compose up
   ```

### Out of Disk Space

**Problem:** Docker build fails with "no space left on device".

**Solution:**

```bash
# Remove unused Docker data
docker system prune -a

# Explicitly remove volumes
docker volume prune
```

### Frontend Shows "Cannot GET /"

**Problem:** Frontend is running but shows 404 error.

**Solution:**

1. Check the frontend logs:
   ```bash
   docker-compose logs frontend
   ```

2. Ensure Next.js built correctly. Look for output like:
   ```
   ready - started server on 0.0.0.0:3000
   ```

3. If not present, restart frontend:
   ```bash
   docker-compose restart frontend
   ```

4. Wait 10–15 seconds and refresh your browser.

### API Returns 502 Bad Gateway

**Problem:** Frontend can't reach backend.

**Solution:**

1. Verify backend is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. If it's down, restart it:
   ```bash
   docker-compose restart backend
   ```

3. Check backend logs for errors:
   ```bash
   docker-compose logs backend
   ```

### Database Schema Missing Tables

**Problem:** Supabase is running but tables don't exist.

**Solution:**

The schema is automatically loaded from `backend/supabase_schema.sql`. If tables are missing:

```bash
# Restart the database with a fresh schema
docker-compose down -v
docker-compose up
```

Or manually run the schema:

```bash
docker-compose exec supabase psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql
```

### Environment Variables Not Loading

**Problem:** Backend doesn't see variables you added to `.env.local`.

**Solution:**

1. Verify the `.env.local` file exists in the repository root:
   ```bash
   ls -la .env.local
   ```

2. Restart the stack to reload environment:
   ```bash
   docker-compose down
   docker-compose up
   ```

3. Check that variables are being set:
   ```bash
   docker-compose exec backend env | grep TELNYX
   ```

### Voice / Telephony Features Don't Work

**Problem:** Calls fail or voice is not recognized.

**Solution:**

1. Verify all API keys are set in `.env.local`:
   ```bash
   docker-compose exec backend python -c "import os; print(os.getenv('OPENAI_API_KEY'))"
   ```

2. Test each service individually:
   ```bash
   # Check Deepgram
   curl -H "Authorization: Token YOUR_DEEPGRAM_KEY" https://api.deepgram.com/v1/status
   ```

3. If testing with a real phone number, ensure Telnyx is configured with valid credentials and a provisioned AU number.

---

## Next Steps

### 0. Before Moving to Production

> **Important:** Before deploying to a production server, ensure your local stack runs smoothly and all tests pass. This guide covers local development only. When ready for production, see **[`DEPLOYMENT.md`](DEPLOYMENT.md)** for complete Oracle Cloud deployment steps including infrastructure setup, SSL/HTTPS, and monitoring.

### 1. Understand the Architecture

Read `CLAUDE.md` in the repository root for technical decisions and sprint roadmap.

### 2. Explore the API

Visit http://localhost:8000/docs and try out endpoints like:
- `POST /api/v1/restaurants` — Create a test restaurant
- `GET /api/v1/restaurants/{id}` — Retrieve restaurant
- `POST /api/v1/orders` — Create a test order

### 3. Deploy to Production

When you're ready to deploy to a server, see **[`DEPLOYMENT.md`](DEPLOYMENT.md)** for Oracle Cloud setup including:
- Infrastructure provisioning with Terraform
- SSL/HTTPS configuration
- Domain setup and monitoring

### 4. Run Tests

Ensure all tests pass before making commits:

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

### 5. Read Code Docs

- **Backend:** `backend/README.md` (if exists) or explore `backend/app/`
- **Frontend:** `frontend/README.md` (if exists) or explore `frontend/src/`
- **Database:** `backend/supabase_schema.sql` for table definitions

### 6. Set Up Git Hooks (Optional)

To auto-run tests before commits:

```bash
# Create a pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
docker-compose exec -T backend pytest || exit 1
docker-compose exec -T frontend npm test || exit 1
EOF
chmod +x .git/hooks/pre-commit
```

---

## Getting Help

### Common Issues Checklist

- [ ] Docker and Docker Compose installed? (`docker --version`, `docker-compose --version`)
- [ ] Required ports available? (3000, 8000, 5432, 6379, 54321)
- [ ] `.env.local` file exists? (`ls -la .env.local`)
- [ ] All services running healthily? (`docker-compose ps`)
- [ ] Logs checked for errors? (`docker-compose logs --tail=50`)

### Useful Commands Reference

```bash
# View all running containers
docker-compose ps

# View logs for specific service
docker-compose logs -f backend

# Execute a command in a service
docker-compose exec backend python -c "print('test')"

# Rebuild images from scratch
docker-compose build --no-cache

# Remove everything and start fresh
docker-compose down -v
docker system prune -a
docker-compose up

# Run tests
docker-compose exec backend pytest
docker-compose exec frontend npm test

# Access Redis CLI
docker-compose exec redis redis-cli

# Access PostgreSQL CLI
docker-compose exec supabase psql -U postgres
```

### Get Support

- Check logs: `docker-compose logs -f`
- Review code in `backend/` or `frontend/`
- Check API documentation: http://localhost:8000/docs
- Review project decisions: Read `CLAUDE.md`

---

**Last Updated:** 2026-08-30
**Maintained by:** TalkByte Development Team
