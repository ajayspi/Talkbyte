# Daily Demo Quick Reference — Oracle Cloud Free Tier

> **Quick Start:** 7am SSH → pull code → start containers → demo until 12pm → stop containers (no data loss)
>
> All data persists in **Supabase Cloud + Upstash Redis** (managed services, not on the VM).

---

## Table of Contents

1. [Morning Startup (7am)](#morning-startup-7am)
2. [During Demo (7am–12pm)](#during-demo-7am12pm)
3. [Afternoon Shutdown (12pm)](#afternoon-shutdown-12pm)
4. [Troubleshooting During Demo](#troubleshooting-during-demo)
5. [Demo Scenarios](#demo-scenarios)
6. [Emergency Procedures](#emergency-procedures)
7. [Links & Dashboards](#links--dashboards)

---

## Morning Startup (7am)

### 1. SSH into Oracle VM

Replace `[REPLACE_WITH_PUBLIC_IP]` with your Oracle instance's public IP address (from Oracle Cloud Console → Compute → Instances).

```bash
ssh ubuntu@[REPLACE_WITH_PUBLIC_IP]
```

**Expected output:**
```
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-...)
Last login: Fri Aug 30 06:45:23 2026 from 1.2.3.4
ubuntu@instance-xxxxx:~$
```

If you get `Permission denied`, check your SSH key file permissions:
```bash
chmod 600 ~/.ssh/id_rsa
```

### 2. Navigate to Repository

```bash
cd ~/talkbyte
pwd
```

**Expected output:**
```
/home/ubuntu/talkbyte
```

### 3. Pull Latest Code

```bash
git pull origin main
```

**Expected output (if no changes):**
```
Already up to date.
```

**Expected output (if changes):**
```
Updating abc1234..def5678
Fast-forward
 backend/app/services/llm.py | 15 ++++++++++----
 1 file changed, 12 insertions(+), 3 deletions(-)
```

### 4. Load Environment Variables

Verify your `.env.prod` file exists (created in ORACLE_CLOUD_SETUP.md, Step 5b):

```bash
ls -la .env.prod
cat .env.prod | grep -E "SUPABASE_URL|UPSTASH_REDIS" | head -2
```

**Expected output:**
```
-rw-r--r-- 1 ubuntu ubuntu 2847 Aug 29 12:00 .env.prod
SUPABASE_URL=https://abc123.supabase.co
UPSTASH_REDIS_REST_URL=https://def456.upstash.io
```

### 5. Start All Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Expected output:**
```
Creating network "talkbyte_talkbyte-prod" with driver "bridge"
Pulling backend (your-registry/talkbyte-backend:latest)...
Pulling frontend (your-registry/talkbyte-frontend:latest)...
Creating talkbyte-backend-1  ... done
Creating talkbyte-frontend-1 ... done
```

### 6. Wait for Services to Become Healthy

Wait **30–60 seconds** for containers to initialize. Then check status:

```bash
docker-compose -f docker-compose.prod.yml ps
```

**Expected output (HEALTHY = ready to serve):**
```
NAME                  STATUS           PORTS
talkbyte-backend-1    Up (healthy)     0.0.0.0:8000->8000/tcp
talkbyte-frontend-1   Up (healthy)     0.0.0.0:3000->3000/tcp
```

**If NOT healthy yet,** wait 20 more seconds and retry. If they stay in `starting` or `unhealthy`, skip to **Troubleshooting**.

### 7. Verify Backend API

Test the API endpoint:

```bash
curl http://localhost:8000/docs
```

**Expected output (first 200 bytes):**
```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FastAPI - Swagger UI</title>
    ...
```

If you get `Connection refused`, the backend hasn't started yet. Wait 30 more seconds.

### 8. Verify Frontend

Test the frontend endpoint:

```bash
curl -s http://localhost:3000 | head -50
```

**Expected output (contains HTML):**
```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    ...
    <title>TalkByte AI</title>
    ...
```

### 9. Announce Demo is Live

Share this URL with demo attendees:

```
Frontend: http://[REPLACE_WITH_PUBLIC_IP]:3000
Backend API (Swagger Docs): http://[REPLACE_WITH_PUBLIC_IP]:8000/docs
```

Replace `[REPLACE_WITH_PUBLIC_IP]` with the actual public IP.

**Note:** They should use your public IP, **NOT** `localhost`. Localhost only works on the VM.

### Summary: Morning Startup Checklist

- [ ] SSH into VM successfully
- [ ] `cd ~/talkbyte` and confirm directory
- [ ] `git pull origin main` completed
- [ ] `.env.prod` exists and has credentials
- [ ] `docker-compose -f docker-compose.prod.yml up -d` started
- [ ] Both containers show `Up (healthy)` status
- [ ] Backend Swagger docs load at `http://localhost:8000/docs`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Demo attendees have the public IP URL

---

## During Demo (7am–12pm)

### Live Services (Keep on During Demo)

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Frontend** | `http://[REPLACE_WITH_PUBLIC_IP]:3000` | 3000 | Restaurant dashboard + demo UI |
| **Backend API** | `http://[REPLACE_WITH_PUBLIC_IP]:8000` | 8000 | REST API + voice handlers |
| **Swagger Docs** | `http://[REPLACE_WITH_PUBLIC_IP]:8000/docs` | 8000 | Interactive API documentation |

### Monitor Logs in Real-Time

Open a second SSH session and stream logs:

```bash
ssh ubuntu@[REPLACE_WITH_PUBLIC_IP]
cd ~/talkbyte
docker-compose -f docker-compose.prod.yml logs -f backend
```

**Example output (order received):**
```
backend  | INFO:     127.0.0.1:45234 - "POST /api/v1/orders HTTP/1.1" 201 Created
backend  | [2026-08-30 11:23:45] Order received: id=ord_abc123, restaurant=Test Cafe, items=2
backend  | [2026-08-30 11:23:46] STT confidence: 94.2%
backend  | [2026-08-30 11:23:47] LLM response (GPT-4.1): "Order confirmed, sending payment link..."
```

### Access Redis Cache (Optional)

To see session cache or call state:

```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli
```

Then in the Redis CLI:

```
127.0.0.1:6379> KEYS *
(Shows all keys in cache)
127.0.0.1:6379> GET call_session_abc123
(Shows call state for a specific call)
127.0.0.1:6379> QUIT
(Exit Redis CLI)
```

### Access Supabase Database (If Needed)

For quick SQL queries, go to the **Supabase Cloud Dashboard** (see Links below), open **SQL Editor**, and run:

```sql
-- Count calls today
SELECT COUNT(*) FROM calls WHERE created_at >= NOW() - INTERVAL '1 day';

-- List recent orders
SELECT id, restaurant_id, total_cents, state, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Find a specific restaurant
SELECT * FROM restaurants WHERE name LIKE '%Test%';
```

### Check System Health

If demo runs slowly, check VM resources:

```bash
free -h                          # RAM usage
df -h                            # Disk usage
docker stats                     # Per-container CPU/RAM (Ctrl+C to exit)
```

**Healthy targets:**
- **RAM:** <50% used (12GB VM should have 6GB+ free)
- **Disk:** <80% used (200GB storage)
- **CPU:** Spikes during calls, idles between

### Restart a Single Service (If Needed)

If only the backend crashes but frontend is fine:

```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml logs -f backend
```

Wait for `healthy` status (30 seconds).

---

## Afternoon Shutdown (12pm)

### 1. Stop All Services

```bash
docker-compose -f docker-compose.prod.yml down
```

**Expected output:**
```
Stopping talkbyte-frontend-1  ... done
Stopping talkbyte-backend-1   ... done
Removing talkbyte-frontend-1  ... done
Removing talkbyte-backend-1   ... done
Removing network talkbyte_talkbyte-prod
```

### 2. Verify Services Are Stopped

```bash
docker-compose -f docker-compose.prod.yml ps
```

**Expected output (empty):**
```
NAME      STATUS
(no containers listed)
```

### 3. Confirm No Data Loss

All data persists in managed services:

- **Supabase Cloud:** Restaurant data, call logs, orders, payments
- **Upstash Redis:** Session state, cache (auto-expires after 30 min)

**No need to back up anything.** Just close the SSH connection:

```bash
exit
```

### 4. Notify Oracle Cloud (Optional)

If you want to free up resources immediately (not required; free tier allows this VM to sit idle):

```bash
# This will terminate the VM (warning: can't easily restart without rebuilding)
# Don't do this unless you're ending demos permanently
# oracle-cli compute instance terminate --instance-id [INSTANCE_ID]
```

For daily demos, just leave the VM stopped (no running costs during shutdown).

---

## Troubleshooting During Demo

### Issue: Containers Won't Start

**Error message:** `docker-compose up -d` says containers exited

**Quick fix:**
```bash
docker-compose -f docker-compose.prod.yml logs backend | tail -30
```

Look for errors like:
- `SUPABASE_URL not found` → Check `.env.prod` is loaded correctly
- `Connection refused at 127.0.0.1:6379` → Redis issue (shouldn't happen with Upstash)
- `Unable to connect to Supabase` → Check Supabase Cloud dashboard (service paused?)

**Restart solution:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

Then wait 60 seconds and re-check status.

### Issue: Backend API Unresponsive (Port 8000)

**Error:** `curl: (7) Failed to connect to localhost port 8000`

**Quick fix:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

If backend shows `Exited` or `Unhealthy`:

```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml logs -f backend | tail -50
```

Wait 30 seconds, then `curl http://localhost:8000/docs` again.

If still failing, check `.env.prod` for missing API keys (Telnyx, OpenAI, etc.).

### Issue: Frontend Shows Blank Page

**Error:** Browser shows white screen, no error console messages

**Quick fix:**
```bash
# Verify NEXT_PUBLIC_BACKEND_URL points to correct IP
grep NEXT_PUBLIC_BACKEND_URL .env.prod

# Should output:
# NEXT_PUBLIC_BACKEND_URL=http://[YOUR_PUBLIC_IP]:8000
```

If IP is wrong or uses `localhost`, edit `.env.prod`:
```bash
nano .env.prod
```

Find the line `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` and change `localhost` to your public IP:
```
NEXT_PUBLIC_BACKEND_URL=http://203.0.113.45:8000
```

Then restart frontend:
```bash
docker-compose -f docker-compose.prod.yml restart frontend
```

Wait 30 seconds. Then hard-refresh browser (Ctrl+Shift+R).

### Issue: Database Connection Timeout

**Error in logs:** `psycopg2.OperationalError: could not connect to server`

**Quick fix:**

1. Verify Supabase is running (go to Supabase Dashboard):
   - https://supabase.com/dashboard
   - Click your project → check status (should be "Active")
   - If paused, click "Resume"

2. Verify connection string in `.env.prod`:
   ```bash
   grep SUPABASE_URL .env.prod
   ```

3. Test Supabase connectivity:
   ```bash
   curl https://YOUR_SUPABASE_URL/health
   ```

If Supabase dashboard is down, contact Supabase support. For demos, this is rare.

### Issue: Redis Connection Error

**Error in logs:** `ConnectionError: Error -2 connecting to Upstash Redis`

**Quick fix:**

1. Go to Upstash Console:
   - https://console.upstash.com
   - Click your Redis database
   - Check status (should be "Active")

2. Verify Redis credentials in `.env.prod`:
   ```bash
   grep UPSTASH_REDIS .env.prod
   ```

3. Test connectivity:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://YOUR_UPSTASH_URL/ping
   ```

### Issue: Out of Memory (OOMKilled)

**Error:** Services keep crashing, `free -h` shows <1GB available

**Quick fix:**

1. Check what's using memory:
   ```bash
   docker stats
   ```

2. Restart services to clear caches:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker system prune -a -f
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. If still low, check if other processes are running:
   ```bash
   ps aux | grep -E "node|python" | grep -v docker
   ```

Kill any stray processes.

### Issue: Disk Full (No Space Left on Device)

**Error:** `docker-compose up` fails with "No space left on device"

**Quick fix:**

1. Check disk usage:
   ```bash
   df -h /
   ```

2. Clean Docker images and volumes:
   ```bash
   docker image prune -a -f
   docker volume prune -f
   docker system prune -a -f
   ```

3. Check individual container sizes:
   ```bash
   docker system df
   ```

If you're still >90% full, you may need to increase storage in Oracle Cloud Console.

---

## Demo Scenarios

### Scenario 1: Test Restaurant Order Flow

**Goal:** Create a restaurant, take an order, verify in database

**Steps:**

1. **Create a test restaurant via API:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/restaurants \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Demo Pizza Place",
       "phone_number": "+61412345678",
       "ai_instructions": "Be friendly, confirm each item. Total price at end."
     }'
   ```

   **Expected response:**
   ```json
   {
     "id": "rest_abc123",
     "name": "Demo Pizza Place",
     "phone_number": "+61412345678",
     "created_at": "2026-08-30T11:45:00Z"
   }
   ```

   **Save the `id` for next steps.**

2. **Add menu items to the restaurant:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/restaurants/rest_abc123/menu \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Margherita Pizza",
       "description": "Classic cheese and tomato",
       "price_cents": 1599,
       "category": "Pizzas",
       "available": true
     }'
   ```

   Repeat for a few more items (Pepperoni, Garlic Bread, etc.).

3. **Simulate an incoming call** (if LiveKit + Telnyx are configured):
   - Use the Telnyx test number or your provisioned AU number
   - Caller will hear: "Welcome to Demo Pizza Place. How can I help?"
   - Place an order: "Two margheritas and one garlic bread"
   - Confirm total
   - AI sends SMS with payment link

4. **Verify in database:**
   ```bash
   # Check if call was logged
   docker-compose -f docker-compose.prod.yml exec supabase psql -U postgres -d postgres -c \
     "SELECT id, restaurant_id, caller_number, state, created_at FROM calls ORDER BY created_at DESC LIMIT 1;"
   ```

   (Note: `supabase` is the Postgres service name in `docker-compose.prod.yml`. Adjust if using Supabase Cloud — see Supabase Dashboard instead.)

### Scenario 2: Check Call Logs and Transcripts

**Goal:** Review what the AI heard and said during a call

**Steps:**

1. **Stream real-time backend logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f backend | grep -i "STT\|LLM\|order"
   ```

   You'll see:
   ```
   [2026-08-30 11:45:23] STT: "Two margheritas and one garlic bread"
   [2026-08-30 11:45:24] LLM intent: order_placement, confidence: 0.98
   [2026-08-30 11:45:25] TTS: "Confirmed, two margheritas and one garlic bread..."
   ```

2. **Manually check logs afterward:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend --tail=200 > /tmp/demo_logs.txt
   cat /tmp/demo_logs.txt
   ```

### Scenario 3: Payment Link Flow

**Goal:** Generate and share a payment link (requires Stripe keys)

**Steps:**

1. **After an order is confirmed, the system automatically:**
   - Generates a Stripe Payment Link
   - Sends SMS with the link
   - Logs `payment_events` table entry

2. **Check payment status in Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Run:
     ```sql
     SELECT order_id, stripe_payment_link, sent_at, paid_at 
     FROM payment_events 
     ORDER BY sent_at DESC 
     LIMIT 5;
     ```

3. **Test payment completion** (if using Stripe test mode):
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

   This simulates a completed payment in your demo.

### Scenario 4: Check Redis Cache State

**Goal:** View what's stored in call sessions

**Steps:**

1. **Access Redis CLI:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec redis redis-cli
   ```

2. **See all keys:**
   ```
   127.0.0.1:6379> KEYS *
   1) "call_session_xyz789"
   2) "restaurant_menu_cache_rest_abc123"
   ```

3. **View a call session:**
   ```
   127.0.0.1:6379> GET call_session_xyz789
   "{\"state\": \"CONFIRMED\", \"items\": [{\"name\": \"Margherita\", \"qty\": 2}], ...}"
   ```

4. **Exit Redis:**
   ```
   127.0.0.1:6379> QUIT
   ```

---

## Emergency Procedures

### Full Restart (If Everything Breaks)

```bash
# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional, saves space)
docker system prune -a -f

# Rebuild and start fresh
docker-compose -f docker-compose.prod.yml up -d

# Wait 60 seconds, then verify
sleep 60
docker-compose -f docker-compose.prod.yml ps
```

### Restart Only Backend (Keep Frontend Running)

```bash
docker-compose -f docker-compose.prod.yml restart backend
sleep 30
docker-compose -f docker-compose.prod.yml ps
```

### Restart Only Frontend (Keep Backend Running)

```bash
docker-compose -f docker-compose.prod.yml restart frontend
sleep 30
docker-compose -f docker-compose.prod.yml ps
```

### Force Rebuild (If Stale Docker Image)

```bash
docker-compose -f docker-compose.prod.yml build --no-cache backend
docker-compose -f docker-compose.prod.yml up -d backend
```

### Completely Clear All Docker State (Nuclear Option)

**Warning: Removes all Docker containers, images, and volumes on the VM. Managed services (Supabase, Upstash) are unaffected.**

```bash
docker-compose -f docker-compose.prod.yml down --volumes
docker system prune -a -f
docker-compose -f docker-compose.prod.yml up -d
```

### Check if Services Are Really Running

```bash
# List all containers (including stopped)
docker ps -a

# Show full logs for debugging
docker-compose -f docker-compose.prod.yml logs backend 2>&1 | head -100
docker-compose -f docker-compose.prod.yml logs frontend 2>&1 | head -100
```

### Tail Logs in Real-Time (Ctrl+C to Stop)

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Or follow only backend:

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Links & Dashboards

### Managed Services (External — Survive VM Shutdown)

| Service | URL | Purpose |
|---------|-----|---------|
| **Supabase Cloud** | https://supabase.com/dashboard | Database, table editor, SQL queries, backups |
| **Upstash Console** | https://console.upstash.com | Redis cache, stats, logs |
| **Stripe Dashboard** | https://dashboard.stripe.com | Payment events, test cards |
| **Telnyx Portal** | https://portal.telnyx.com | Inbound calls, phone numbers, SIP config |
| **LiveKit Cloud** | https://cloud.livekit.io | Voice sessions, metrics |
| **Deepgram Console** | https://console.deepgram.com | STT usage, API keys |
| **OpenAI Platform** | https://platform.openai.com | LLM costs, model status |
| **ElevenLabs Dashboard** | https://elevenlabs.io/app | TTS voices, usage |

### Local / On-VM (Only During 7am–12pm)

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend Demo** | `http://[REPLACE_WITH_PUBLIC_IP]:3000` | Restaurant dashboard |
| **Backend Swagger** | `http://[REPLACE_WITH_PUBLIC_IP]:8000/docs` | Interactive API docs |
| **Backend Health** | `http://[REPLACE_WITH_PUBLIC_IP]:8000/health` | Service status (GET request) |

### Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| **Initial Setup** | [`ORACLE_CLOUD_SETUP.md`](ORACLE_CLOUD_SETUP.md) | How to create Oracle VM, Supabase, Upstash (first-time only) |
| **Local Dev** | [`LOCAL_DEV_SETUP.md`](LOCAL_DEV_SETUP.md) | How to run entire stack locally on your laptop |
| **Production** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | Full production deployment with SSL/Nginx (longer-term) |
| **Architecture** | [`../CLAUDE.md`](../CLAUDE.md) | Tech stack decisions, database schema, call state machine |

---

## Quick Command Reference

**All commands assume you're SSH'd into the VM and `cd ~/talkbyte`.**

| Task | Command |
|------|---------|
| **Start services** | `docker-compose -f docker-compose.prod.yml up -d` |
| **Stop services** | `docker-compose -f docker-compose.prod.yml down` |
| **Check status** | `docker-compose -f docker-compose.prod.yml ps` |
| **View logs (backend)** | `docker-compose -f docker-compose.prod.yml logs -f backend` |
| **View logs (all)** | `docker-compose -f docker-compose.prod.yml logs -f` |
| **Restart backend** | `docker-compose -f docker-compose.prod.yml restart backend` |
| **Test backend API** | `curl http://localhost:8000/docs` |
| **Test frontend** | `curl http://localhost:3000` |
| **Check disk** | `df -h` |
| **Check RAM** | `free -h` |
| **Pull latest code** | `git pull origin main` |
| **Access Redis CLI** | `docker-compose -f docker-compose.prod.yml exec redis redis-cli` |
| **View container stats** | `docker stats` |

---

## Checklist for Daily Demo

### Morning (7am)

- [ ] SSH into `ubuntu@[REPLACE_WITH_PUBLIC_IP]`
- [ ] `cd ~/talkbyte` and confirm directory
- [ ] `git pull origin main` (fetch latest code)
- [ ] Verify `.env.prod` exists and has all API keys
- [ ] `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Wait 60 seconds for services to start
- [ ] `docker-compose -f docker-compose.prod.yml ps` (verify "healthy")
- [ ] `curl http://localhost:8000/docs` (verify backend)
- [ ] `curl http://localhost:3000` (verify frontend)
- [ ] Share frontend URL with attendees: `http://[REPLACE_WITH_PUBLIC_IP]:3000`

### During Demo (7am–12pm)

- [ ] Monitor logs: `docker-compose -f docker-compose.prod.yml logs -f backend`
- [ ] Check Supabase Dashboard for new orders/calls
- [ ] Check Upstash Console for cache hit rate
- [ ] If service fails: Restart it (`docker-compose restart backend`)
- [ ] If still broken: Rebuild (`docker-compose down && docker-compose up -d`)

### Afternoon (12pm)

- [ ] Stop services: `docker-compose -f docker-compose.prod.yml down`
- [ ] Verify stopped: `docker-compose -f docker-compose.prod.yml ps` (should be empty)
- [ ] Confirm data persists: "All data in Supabase Cloud + Upstash"
- [ ] Exit SSH: `exit`

---

## Tips & Best Practices

1. **Keep two SSH sessions open:**
   - Session 1: Run commands (start/stop services)
   - Session 2: Stream logs for monitoring

2. **Use Ctrl+C to stop log streams** (doesn't stop containers)

3. **Hard-refresh browser if frontend looks stale:** Ctrl+Shift+R (not just Ctrl+R)

4. **Database is in Supabase Cloud, not the VM:** No need to back up or restore anything

5. **If things are slow, check `docker stats`** first (likely out of RAM)

6. **All demo data is tied to Supabase project:** Different restaurants / calls are separated by `restaurant_id` in the database

7. **Payment links expire after 30 minutes:** This is configurable in `.env.prod` (`PAYMENT_LINK_TTL_SECONDS`)

8. **Call sessions expire after 30 minutes of inactivity:** Configured in `.env.prod` (`CALL_SESSION_TTL_SECONDS`)

---

## Support & Escalation

| Issue | First Steps | If Still Broken |
|-------|-------------|-----------------|
| **Backend won't start** | Check logs: `docker-compose logs backend` | Rebuild: `docker-compose build --no-cache backend` |
| **Frontend blank page** | Verify `NEXT_PUBLIC_BACKEND_URL` in `.env.prod` | Hard-refresh + clear browser cache |
| **Database timeout** | Check Supabase Dashboard (project paused?) | Contact Supabase support |
| **Redis timeout** | Check Upstash Console (database running?) | Contact Upstash support |
| **Out of memory** | Stop containers + `docker system prune -a -f` | Restart VM or upgrade instance type |
| **Slow performance** | Check `docker stats` (CPU/RAM usage) | Reduce log verbosity, restart services |

---

## FAQ

**Q: Where's my data when the VM shuts down?**  
A: In Supabase Cloud + Upstash Redis (managed services). Fully safe. Restart the VM any time.

**Q: Can I keep the VM running past 12pm?**  
A: Yes, but Oracle's free tier meter stops resetting at 5 hours/day of compute. You'll burn through your free tier faster.

**Q: What if I forget to stop services at 12pm?**  
A: Oracle will hard-stop the VM automatically when you hit 5 hours. Containers will exit ungracefully, but Supabase + Upstash persist.

**Q: Can I run this on weekends?**  
A: Yes, you can use your 5 hours/day on any day. Just SSH in, start services, demo, then stop.

**Q: Is the data encrypted?**  
A: Supabase encrypts at-rest and in-transit (HTTPS). Upstash also encrypts. Suitable for demo data, not sensitive production.

**Q: Can attendees access the demo from their own devices?**  
A: Yes! Give them the public IP URL: `http://[REPLACE_WITH_PUBLIC_IP]:3000`. They can open it in any browser (same network or internet).

**Q: What if the public IP changes?**  
A: It won't, unless you stop the VM for >1 hour and restart. Oracle reassigns IPs after long shutdowns. If it changes, update the `.env.prod` and restart frontend.

---

**Version:** 1.0  
**Last Updated:** 2026-08-30  
**Created for:** Daily 7am–12pm demos on Oracle Cloud Free Tier
