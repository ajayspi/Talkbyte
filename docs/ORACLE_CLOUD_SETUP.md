# Oracle Cloud Deployment — Managed Services Edition

Deploy TalkByte AI to Oracle Cloud Free Tier using **Supabase Cloud** (managed PostgreSQL) and **Upstash Redis** (serverless cache) instead of self-hosted infrastructure.

> **When to use this guide:**
> - You want a **simpler MVP deployment** (less operations overhead)
> - You prefer **managed services** over self-hosted databases
> - You're running **daily demos** (7am–12pm constraint on free tier)
> - You want **no Terraform** — just Docker Compose on a single VM
>
> **For production with SSL/Nginx/monitoring:** See [`DEPLOYMENT.md`](DEPLOYMENT.md)  
> **For local development:** See [`LOCAL_DEV_SETUP.md`](LOCAL_DEV_SETUP.md)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Supabase Cloud Project](#step-1-create-supabase-cloud-project)
3. [Step 2: Create Upstash Redis](#step-2-create-upstash-redis)
4. [Step 3: Create Oracle Compute Instance](#step-3-create-oracle-compute-instance)
5. [Step 4: Set Up Oracle VM](#step-4-set-up-oracle-vm)
6. [Step 5: Deploy TalkByte](#step-5-deploy-talkbyte)
7. [Step 6: Daily Demo (7am–12pm Constraint)](#step-6-daily-demo-7am12pm-constraint)
8. [Step 7: Monitoring & Troubleshooting](#step-7-monitoring--troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

### Accounts (Create in this order)

1. **Oracle Cloud free tier account** — https://www.oracle.com/cloud/free/
   - Requires valid email + payment method (charges only if you exceed free tier)
   - Free tier includes: 2 x VM.Standard.A1.Flex (ARM, 2 OCPU each), 200GB block storage, 10GB bandwidth/month

2. **Supabase Cloud account** — https://supabase.com
   - Free tier includes: 500MB database, 1GB file storage, unlimited API requests
   - Create one project (we'll create more repos there later)

3. **Upstash account** — https://upstash.com
   - Free tier includes: serverless Redis database, 10k commands/day
   - Create one Redis database for this demo

### Local Tools

- **Git** (to clone the repo)
  - Verify: `git --version`

- **SSH Client** (to connect to Oracle VM)
  - macOS/Linux: Built-in `ssh`
  - Windows: OpenSSH (built-in) or PuTTY (https://www.putty.org)
  - Verify: `ssh -V` or `putty -V`

- **curl or Postman** (optional, to test API after deployment)

### System Requirements

- Internet connection (stable, ~2 Mbps upload for calls)
- A text editor (VS Code, nano, etc.)

---

## Step 1: Create Supabase Cloud Project

### 1a. Sign Up & Log In

1. Go to https://supabase.com and click **Sign Up**
2. Create account (GitHub, email, etc.)
3. Verify your email
4. Log into the **Supabase dashboard**

### 1b. Create a New Project

1. Click **New Project** (or the `+` button)
2. Fill in:
   - **Name:** `talkbyte-demo` (or any name)
   - **Database password:** Generate a strong password (store it securely!)
   - **Region:** `ap-southeast-1` (Singapore, closest to Australia)
   - **Pricing plan:** Leave as **Free**
3. Click **Create new project**
4. Wait 2–3 minutes for the database to initialize

### 1c. Obtain Credentials

Once the project is created:

1. Click your project name
2. Go to **Settings** → **API**
3. You'll see:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **Anon Key** (safe for client)
   - **Service Role Key** (secret — keep private!)

4. Copy and save these three values:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

### 1d. Load Database Schema

1. In the Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `backend/supabase_schema.sql` from the repo
4. Copy **all contents** into the SQL editor
5. Click **Run** (green play button)
6. You'll see output like:
   ```
   CREATE EXTENSION
   CREATE TABLE
   INSERT 0 3
   ... (repeat for all tables)
   ```

**Verify:** Go to **Table Editor** in the left sidebar. You should see tables:
- `plans` (3 rows)
- `restaurants` (empty)
- `menu_items` (empty)
- `calls` (empty)
- `orders` (empty)
- `payment_events` (empty)
- `subscriptions` (empty)

---

## Step 2: Create Upstash Redis

### 2a. Sign Up & Log In

1. Go to https://upstash.com and click **Sign Up**
2. Create account (Google, GitHub, email)
3. Verify email
4. Log into the **Upstash Console**

### 2b. Create Redis Database

1. In the console, click **Create Database**
2. Fill in:
   - **Name:** `talkbyte-demo`
   - **Region:** `ap-southeast-1` (or `ap-sydney`)
   - **Type:** Leave as **Redis**
   - **Eviction Policy:** `NoEviction` (for demo — change to `Allkeys-LRU` in production)
3. Click **Create**
4. Wait 30 seconds for the database to initialize

### 2c. Obtain Credentials

Once created:

1. Click on the database name
2. You'll see:
   - **Redis URL** (e.g., `redis://default:PASSWORD@ENDPOINT:6379`)
   - **REST API URL** (e.g., `https://xxxx.upstash.io`)
   - **REST API Token**

3. Copy and save:
   ```
   UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```

   **Alternative:** Also note the Redis URL for Celery:
   ```
   CELERY_BROKER_URL=redis://default:PASSWORD@ENDPOINT:6379
   ```

---

## Step 3: Create Oracle Compute Instance

### 3a. Log Into Oracle Cloud Console

1. Go to https://cloud.oracle.com
2. Log in with your Oracle Cloud account
3. You should see the Oracle Cloud Dashboard

### 3b. Navigate to Instances

1. Click the **☰ (hamburger menu)** in the top-left
2. Go to **Compute** → **Instances**
3. Click **Create Instance**

### 3c. Configure Instance

Fill in the form:

**Image and shape:**
- **Image:** Ubuntu 22.04 minimal (or latest LTS available)
  - Click **Change Image** if not already selected
  - Select **Canonical**
  - Choose **Ubuntu 22.04 (Minimal)** or **Ubuntu 24.04**

- **Instance type:** Virtual Machine
- **Shape:** Click **Change Shape**
  - Under "Ampere (ARM)", select **VM.Standard.A1.Flex**
  - Set **OCPU:** 2
  - Set **Memory (GB):** 12
  - These are free tier eligible ✓

**Boot volume:**
- **Boot volume size:** 200 GB (free tier maximum)

**Primary network:**
- Leave as default VCN/Subnet (should auto-create)
- **Public IPv4 address:** Assign Public IPv4 Address ✓

**Add SSH key:**
- **SSH Keys:** Click **Paste SSH Public Key**
  - If you have an existing SSH key: paste the contents of `~/.ssh/id_rsa.pub`
  - If you don't have one, generate it first:
    ```bash
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    ```
  - Then paste the **public key** (`.pub` file)

**Click Create** at the bottom

### 3d. Wait for Instance to Start

- Status will show **PROVISIONING**, then **RUNNING**
- Once **RUNNING**, note the **Public IPv4 Address** (e.g., `203.0.113.45`)
- Save this IP for later

---

## Step 4: Set Up Oracle VM

### 4a. SSH Into Instance

On your local machine, open a terminal:

```bash
ssh ubuntu@YOUR_PUBLIC_IP
```

Replace `YOUR_PUBLIC_IP` with the IP from Step 3d.

**Expected output:**
```
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-...)
...
ubuntu@instance-20260830-1234:~$
```

### 4b. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

Wait for this to complete (2–3 minutes).

### 4c. Install Docker & Docker Compose

```bash
sudo apt install -y docker.io docker-compose
```

### 4d. Add ubuntu User to docker Group

```bash
sudo usermod -aG docker ubuntu
```

**Log out and back in for this to take effect:**

```bash
exit
```

Then SSH back in:

```bash
ssh ubuntu@YOUR_PUBLIC_IP
```

### 4e. Verify Installation

```bash
docker --version
docker-compose --version
```

Both should show version numbers (no `sudo` needed now).

---

## Step 5: Deploy TalkByte

### 5a. Clone the Repository

```bash
git clone https://github.com/[REPLACE_WITH_ORG]/talkbyte.git
cd talkbyte
```

Replace `[REPLACE_WITH_ORG]` with your GitHub organization. For example:
```bash
git clone https://github.com/acme-restaurants/talkbyte.git
```

### 5b. Create Production Environment File

Create `.env.prod` in the repo root:

```bash
cat > .env.prod << 'EOF'
# ── Supabase Cloud (from Step 1c) ────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Upstash Redis (from Step 2c) ─────────────────────────────
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
CELERY_BROKER_URL=redis://default:PASSWORD@ENDPOINT:6379

# ── Telnyx (voice provider) ──────────────────────────────────
TELNYX_API_KEY=KEY...
TELNYX_PUBLIC_KEY=...
TELNYX_SIP_CONNECTION_ID=...
TELNYX_MESSAGING_PROFILE_ID=...

# ── LiveKit (voice orchestration) ────────────────────────────
LIVEKIT_URL=wss://your-app.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...

# ── Deepgram (STT) ───────────────────────────────────────────
DEEPGRAM_API_KEY=...

# ── OpenAI (LLM) ─────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1

# ── ElevenLabs (TTS) ─────────────────────────────────────────
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...

# ── Stripe (payments, optional for MVP) ──────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Square POS (optional for MVP) ───────────────────────────
SQUARE_APPLICATION_ID=sq0idp-...
SQUARE_APPLICATION_SECRET=...
SQUARE_ENVIRONMENT=sandbox

# ── App Settings ─────────────────────────────────────────────
ENVIRONMENT=production
SECRET_KEY=your-secret-key-change-me
FRONTEND_URL=http://YOUR_PUBLIC_IP:3000
CALL_SESSION_TTL_SECONDS=1800
PAYMENT_LINK_TTL_SECONDS=1800
EOF
```

Replace placeholders:
- `https://xxxx.supabase.co` → Your Supabase URL from Step 1c
- `eyJ...` → Your Supabase keys from Step 1c
- `https://xxxx.upstash.io` → Your Upstash REST URL from Step 2c
- `UPSTASH_REDIS_REST_TOKEN` → Your Upstash token from Step 2c
- `redis://default:PASSWORD@ENDPOINT:6379` → Your Upstash Redis URL from Step 2c
- `YOUR_PUBLIC_IP` → The IP from Step 3d (e.g., `203.0.113.45`)
- All API keys from Telnyx, LiveKit, Deepgram, OpenAI, ElevenLabs (obtain from their respective dashboards if you haven't already)

### 5c. Create Docker Compose Production File

Create `docker-compose.prod.yml` in the repo root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env.prod
    environment:
      - ENVIRONMENT=production
      - LOG_LEVEL=info
    networks:
      - talkbyte-prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env.prod
    environment:
      - NEXT_PUBLIC_ENVIRONMENT=production
      - NEXT_PUBLIC_DEBUG=false
    depends_on:
      - backend
    networks:
      - talkbyte-prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped

networks:
  talkbyte-prod:
    driver: bridge
```

Save this file and commit it to the repo (it's safe for production).

### 5d. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Watch the output:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Wait 30–60 seconds for both services to become healthy.

### 5e. Verify Services Are Running

```bash
docker-compose -f docker-compose.prod.yml ps
```

You should see:
```
NAME          STATUS       PORTS
talkbyte-backend-1    Up (healthy)  0.0.0.0:8000->8000/tcp
talkbyte-frontend-1   Up (healthy)  0.0.0.0:3000->3000/tcp
```

Test the services from your local machine:

```bash
# Test backend API
curl http://YOUR_PUBLIC_IP:8000/docs

# Test frontend
curl http://YOUR_PUBLIC_IP:3000
```

Or open in browser:
- Backend API: `http://YOUR_PUBLIC_IP:8000/docs`
- Frontend: `http://YOUR_PUBLIC_IP:3000`

---

## Step 6: Daily Demo (7am–12pm Constraint)

Oracle Cloud free tier limits compute to **5 hours/day** (roughly 7am–12pm). Here's the workflow:

### 6a. Morning Startup (7am)

SSH into the instance:

```bash
ssh ubuntu@YOUR_PUBLIC_IP
cd talkbyte
```

Pull latest code:

```bash
git pull
```

Start services:

```bash
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f backend
```

Wait for "healthy" status (30–60 seconds).

Verify:
```bash
curl http://localhost:8000/docs
curl http://localhost:3000
```

### 6b. Demo Session (7am–12pm)

- Make calls, test orders, verify database saves
- Monitor logs in real-time: `docker-compose -f docker-compose.prod.yml logs -f`
- Create test restaurants via API or frontend

### 6c. Afternoon Shutdown (12pm)

```bash
docker-compose -f docker-compose.prod.yml down
```

This stops containers but **preserves all data**:
- Supabase Cloud keeps all restaurant/call/order data
- Upstash Redis keeps session state
- Local volumes are preserved

### 6d. Next Day

Repeat 6a–6c. All data persists across restarts because databases are managed services.

---

## Step 7: Monitoring & Troubleshooting

### Check Service Status

```bash
# List running containers
docker-compose -f docker-compose.prod.yml ps

# Stream logs from backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Stream logs from frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# See last 50 lines of logs
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
```

### Common Issues

#### Issue: Containers Won't Start

**Error:** `docker-compose up` fails or containers exit immediately

**Solution:**
1. Check logs: `docker-compose -f docker-compose.prod.yml logs backend`
2. Verify `.env.prod` is correct (especially API keys)
3. Rebuild images: `docker-compose -f docker-compose.prod.yml build --no-cache`
4. Restart: `docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d`

#### Issue: Database Connection Timeout

**Error:** `psycopg2.OperationalError: could not connect to server`

**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.prod`
2. Check Supabase Cloud dashboard — ensure project is running (shouldn't be paused)
3. Test connection:
   ```bash
   curl https://YOUR_SUPABASE_URL/health
   ```

#### Issue: Redis Connection Refused

**Error:** `ConnectionError: Error -2 connecting to Upstash Redis`

**Solution:**
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.prod`
2. Check Upstash Console — ensure database is running
3. Test connection:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_UPSTASH_URL/ping
   ```

#### Issue: Out of Memory

**Error:** Containers killed or OOMKilled in logs

**Solution:**
1. Check available memory: `free -h`
2. Stop non-essential containers: `docker stop <container_id>`
3. In production, upgrade VM shape (exit free tier)

#### Issue: High Disk Usage

**Error:** `No space left on device`

**Solution:**
1. Check disk: `df -h`
2. Clean Docker images: `docker image prune -a`
3. Clean Docker volumes: `docker volume prune`
4. If persistent, increase storage in Oracle Cloud Console (free tier allows 200GB total)

#### Issue: Frontend Shows Blank Page

**Error:** Browser shows white screen, no console errors

**Solution:**
1. Check `NEXT_PUBLIC_BACKEND_URL` in `.env.prod` (should be `http://YOUR_PUBLIC_IP:8000`)
2. Verify backend is running: `curl http://YOUR_PUBLIC_IP:8000/docs`
3. Check frontend logs: `docker-compose -f docker-compose.prod.yml logs frontend`
4. Clear browser cache (Ctrl+Shift+Delete)

### Monitoring Supabase Cloud

1. Go to Supabase dashboard → Your project
2. **Table Editor:** View all restaurants, calls, orders in real-time
3. **SQL Editor:** Run custom queries (e.g., "count calls today")
4. **Database:** Check usage (database size, connections)

Example query (SQL Editor):
```sql
-- Count orders today
select count(*) as orders_today
from orders
where created_at >= now() - interval '1 day';
```

### Monitoring Upstash

1. Go to Upstash Console → Your Redis database
2. **Stats:** View commands/sec, connections, memory usage
3. **Logs:** See last operations

---

## Comparison: This Guide vs. DEPLOYMENT.md

| Aspect | This Guide | DEPLOYMENT.md |
|--------|-----------|---------------|
| **Database** | Supabase Cloud | PostgreSQL container + Terraform |
| **Cache** | Upstash Redis | Redis container |
| **IaC** | Docker Compose only | Terraform |
| **SSL/Nginx** | Not included | Full SSL with Let's Encrypt |
| **Time to Deploy** | ~30 min | ~60 min |
| **Operations** | Minimal | More involved |
| **Cost (monthly)** | $0–15 (managed services) | $0–25 (own infrastructure) |
| **Best For** | MVP, demos, small teams | Production, large-scale |

---

## Next Steps

### After First Demo

1. **Create test restaurants** via frontend or API:
   ```bash
   curl -X POST http://YOUR_PUBLIC_IP:8000/api/v1/restaurants \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Cafe",
       "phone_number": "+61412345678",
       "ai_instructions": "Be friendly and professional"
     }'
   ```

2. **Test a call** (requires Telnyx + LiveKit setup):
   - Ensure `TELNYX_API_KEY`, `LIVEKIT_URL`, etc. are filled in `.env.prod`
   - Call the provisioned AU number
   - Verify call appears in Supabase `calls` table

3. **Monitor in production** (see Step 7 above)

### For Longer-Term Use

1. **Domain + SSL** — See Step 6 in [`DEPLOYMENT.md`](DEPLOYMENT.md) for Nginx/Let's Encrypt setup
2. **Backup strategy** — Supabase has built-in backups; Upstash has persistence options
3. **Scaling** — If you exceed free tier, upgrade to paid plans or follow [`DEPLOYMENT.md`](DEPLOYMENT.md) for self-hosted setup

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Upstash Docs:** https://upstash.com/docs
- **Oracle Cloud Docs:** https://docs.oracle.com/en-us/iaas/
- **Docker Docs:** https://docs.docker.com
- **TalkByte Architecture:** See [`CLAUDE.md`](../CLAUDE.md)

---

## Appendix A: Full .env.prod Template

Save this as a reference:

```bash
# Supabase Cloud
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=...
CELERY_BROKER_URL=redis://default:PASSWORD@ENDPOINT:6379

# Telnyx
TELNYX_API_KEY=KEY...
TELNYX_PUBLIC_KEY=...
TELNYX_SIP_CONNECTION_ID=...
TELNYX_MESSAGING_PROFILE_ID=...

# LiveKit
LIVEKIT_URL=wss://your-app.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...

# Deepgram
DEEPGRAM_API_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1

# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Square (optional)
SQUARE_APPLICATION_ID=sq0idp-...
SQUARE_APPLICATION_SECRET=...
SQUARE_ENVIRONMENT=sandbox

# App
ENVIRONMENT=production
SECRET_KEY=change-me-to-random-string
FRONTEND_URL=http://YOUR_PUBLIC_IP:3000
CALL_SESSION_TTL_SECONDS=1800
PAYMENT_LINK_TTL_SECONDS=1800
```

---

## Appendix B: Quick Reference Commands

| Task | Command |
|------|---------|
| **SSH into VM** | `ssh ubuntu@YOUR_PUBLIC_IP` |
| **Start services** | `docker-compose -f docker-compose.prod.yml up -d` |
| **Stop services** | `docker-compose -f docker-compose.prod.yml down` |
| **View logs** | `docker-compose -f docker-compose.prod.yml logs -f backend` |
| **Check status** | `docker-compose -f docker-compose.prod.yml ps` |
| **Test backend** | `curl http://YOUR_PUBLIC_IP:8000/docs` |
| **Test frontend** | `curl http://YOUR_PUBLIC_IP:3000` |
| **Rebuild images** | `docker-compose -f docker-compose.prod.yml build --no-cache` |
| **Pull latest code** | `git pull` (inside repo) |
| **Check free tier limit** | Oracle Cloud Console → Billing & Cost Management |

---

**Last Updated:** 2026-08-30  
**Version:** 1.0 (MVP Edition)
