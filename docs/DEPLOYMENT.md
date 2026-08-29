# Deployment Guide — Oracle Cloud

This guide walks you through deploying TalkByte AI to Oracle Cloud using Terraform and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Oracle Cloud Setup](#oracle-cloud-setup)
3. [Infrastructure Provisioning](#infrastructure-provisioning)
4. [SSH Access](#ssh-access)
5. [Application Deployment](#application-deployment)
6. [Domain & SSL](#domain--ssl)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Cleanup](#cleanup)

---

## Prerequisites

Before deploying, ensure you have:

### Local Tools

- **Terraform** (version 1.0 or later)
  - Download: https://www.terraform.io/downloads
  - Verify: `terraform --version`

- **Oracle Cloud CLI** (optional, but helpful for troubleshooting)
  - Download: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/gettingstarted.htm
  - Verify: `oci --version`

- **SSH Client**
  - macOS/Linux: Built-in `ssh` command
  - Windows: Built-in OpenSSH or PuTTY (https://www.putty.org)
  - Verify: `ssh -V`

- **Git**
  - Verify: `git --version`

### Oracle Cloud Account

- Active Oracle Cloud free tier account (https://www.oracle.com/cloud/free/)
- Access to Oracle Cloud Console (https://cloud.oracle.com)
- Permission to create compute instances and networking resources

### Credentials & Keys

You'll need to obtain:

1. **Oracle Cloud API credentials:**
   - User OCID (from your account settings)
   - Tenancy OCID (from your account settings)
   - API signing key pair (generated in console)

2. **SSH key pair** (for accessing the VM):
   - If you don't have one, generate it:
     ```bash
     ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
     ```

3. **API credentials for external services:**
   - Telnyx API key
   - LiveKit credentials
   - Deepgram API key
   - OpenAI API key
   - ElevenLabs API key
   - Stripe API keys
   - etc. (same as local development)

---

## Oracle Cloud Setup

### Step 1: Create Oracle Cloud Account

1. Go to https://www.oracle.com/cloud/free/
2. Click **Sign Up** and create a new account
3. Verify your email address
4. Set up your payment method (Oracle Cloud free tier requires a valid payment method)
5. Complete the account setup process

### Step 2: Obtain API Credentials

1. Log in to Oracle Cloud Console: https://cloud.oracle.com
2. Click your profile icon (top-right) → **My Profile**
3. Note your **User OCID** (copy and save it)
4. Go to the **Tenancy** option (in your profile dropdown)
5. Note your **Tenancy OCID** (copy and save it)

### Step 3: Generate API Signing Key

1. In Oracle Cloud Console, click your profile icon → **My Profile**
2. Under **API Keys**, click **Add API Key**
3. Download both the private key and the public key fingerprint
4. Save the private key to `~/.oci/oci_api_key.pem`:
   ```bash
   chmod 600 ~/.oci/oci_api_key.pem
   ```
5. Note your **API Key Fingerprint** (e.g., `12:34:56:78:ab:cd:...`)

### Step 4: Find Your Compartment ID

1. In Oracle Cloud Console, go to **Identity & Security** → **Compartments**
2. Find the **root** compartment or your personal compartment
3. Click on it and copy the **Compartment ID** (starts with `ocid1.compartment...`)

### Step 5: Create Environment File for Terraform

Create `deploy/.env.oracle` with your Oracle Cloud credentials:

```bash
export OCI_USER_OCID="ocid1.user.oc1..YOUR_USER_OCID"
export OCI_TENANCY_OCID="ocid1.tenancy.oc1..YOUR_TENANCY_OCID"
export OCI_FINGERPRINT="12:34:56:78:ab:cd:ef:00:11:22:33:44:55:66:77:88"
export OCI_PRIVATE_KEY_PATH="~/.oci/oci_api_key.pem"
export OCI_REGION="ap-sydney-1"
```

Replace values with your actual credentials.

---

## Infrastructure Provisioning

### Step 1: Load Terraform Variables

From the repository root:

```bash
# Load Oracle Cloud credentials into shell
source deploy/.env.oracle
```

Verify the variables are set:

```bash
echo $OCI_USER_OCID
echo $OCI_TENANCY_OCID
```

### Step 2: Initialize Terraform

```bash
cd deploy/terraform
terraform init
```

This downloads the required Terraform provider for Oracle Cloud (OCI).

### Step 3: Create Terraform Variables File

Create `deploy/terraform/terraform.tfvars`:

```hcl
oci_region          = "ap-sydney-1"
compartment_id      = "ocid1.compartment.oc1..YOUR_COMPARTMENT_ID"
ssh_public_key_path = "~/.ssh/id_rsa.pub"
```

Replace `YOUR_COMPARTMENT_ID` with your actual compartment ID from Step 4 above.

### Step 4: Plan the Infrastructure

```bash
terraform plan
```

Review the output to ensure it will create:
- 1 compute instance (VM.Standard.A1.Flex, 2 OCPUs, 12GB RAM)
- 1 VCN (Virtual Cloud Network)
- 1 subnet
- 1 internet gateway
- 1 security list (firewall rules)

### Step 5: Apply the Infrastructure

```bash
terraform apply
```

When prompted, type `yes` to confirm.

This will take 2–5 minutes. Once complete, you'll see output like:

```
Outputs:

instance_public_ip = "132.145.xxx.xxx"
instance_id = "ocid1.instance.oc1..."
vcn_id = "ocid1.vcn.oc1..."
```

**Save the `instance_public_ip` — you'll use it to SSH into the VM.**

---

## SSH Access

### Step 1: Connect to the Instance

```bash
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP
```

Replace `YOUR_PUBLIC_IP` with the instance public IP from the Terraform output.

If you get a "permission denied" error:

```bash
chmod 600 ~/.ssh/id_rsa
```

### Step 2: Verify System is Ready

Once logged in, verify Docker and dependencies are installed:

```bash
docker --version
docker-compose --version
git --version
```

If these commands fail, the init script may still be running. Wait 2–3 minutes and try again.

### Step 3: Verify Init Script Completed

```bash
tail /var/log/cloud-init-output.log
```

Look for output from `init-backend.sh`. If you see errors, review the log to debug.

---

## Application Deployment

### Step 1: Clone the Repository on the VM

```bash
cd /home/ubuntu
git clone https://github.com/your-org/talkbyte.git
cd talkbyte
```

### Step 2: Create Production Environment File

On the VM, create `.env.prod`:

```bash
cat > .env.prod << 'EOF'
# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
SECRET_KEY=$(openssl rand -hex 32)

# Database — use hosted Supabase or RDS
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis — use hosted Upstash or self-managed
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Voice Services
TELNYX_API_KEY=your-telnyx-key
TELNYX_PUBLIC_KEY=your-public-key
TELNYX_SIP_CONNECTION_ID=your-sip-id
LIVEKIT_URL=wss://livekit.your-domain.com
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
DEEPGRAM_API_KEY=your-deepgram-key
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Payments
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
STRIPE_CONNECT_CLIENT_ID=ca_your-id

# POS
SQUARE_APPLICATION_ID=sq0idp-your-id
SQUARE_APPLICATION_SECRET=your-secret
SQUARE_ENVIRONMENT=production

# Frontend
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_BACKEND_URL=https://api.your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF
```

Replace all placeholder values with your production credentials.

### Step 3: Update Docker Compose for Production

The local `docker-compose.yml` uses development settings. For production, you may want to:

1. Remove volume mounts (prevents hot-reload)
2. Set environment to `production`
3. Remove Supabase Studio (not needed in production)
4. Add restart policies

Create `docker-compose.prod.yml` (or update the existing one):

```bash
cp docker-compose.yml docker-compose.prod.yml
```

Edit `docker-compose.prod.yml` and make these changes:

- Remove `volumes:` sections from `backend` and `frontend` (except data volumes)
- Change `environment:` to load from `.env.prod` instead of hardcoded values
- Remove the `supabase-studio:` service
- Add `restart: always` to backend and frontend services

### Step 4: Start Services on the VM

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Verify services are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

All services should show `Up (healthy)`.

### Step 5: Verify Deployment

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend health
curl http://localhost:3000
```

If both respond, the application is running.

---

## Domain & SSL

### Step 1: Point Domain to Instance

1. Go to your domain registrar (e.g., GoDaddy, Namecheap, etc.)
2. Update the **A record** to point to your instance's public IP:
   - Name: `api.your-domain.com` (for backend)
   - Type: `A`
   - Value: `YOUR_INSTANCE_PUBLIC_IP`
3. Also add an A record for your frontend domain:
   - Name: `your-domain.com` (or `app.your-domain.com`)
   - Type: `A`
   - Value: `YOUR_INSTANCE_PUBLIC_IP`

DNS propagation takes 5–30 minutes.

### Step 2: Install Nginx as Reverse Proxy

SSH into your instance and install Nginx:

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/talkbyte`:

```bash
sudo tee /etc/nginx/sites-available/talkbyte > /dev/null << 'EOF'
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/talkbyte /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 4: Get SSL Certificate

Use Let's Encrypt to get a free SSL certificate:

```bash
sudo certbot --nginx -d api.your-domain.com -d your-domain.com
```

Follow the prompts. Certbot will automatically update your Nginx configuration with HTTPS.

### Step 5: Verify HTTPS

```bash
curl https://api.your-domain.com/health
```

---

## Monitoring

### Check Application Logs

View logs for all services:

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

View logs for specific service:

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Monitor Instance via Oracle Cloud Console

1. Go to Oracle Cloud Console: https://cloud.oracle.com
2. Navigate to **Compute** → **Instances**
3. Click on your instance (`talkbyte-backend`)
4. View metrics:
   - CPU usage
   - Memory usage
   - Network traffic
   - Disk I/O

### Set Up Alerts

1. In Oracle Cloud Console, go to **Monitoring** → **Alarms**
2. Create a new alarm for:
   - CPU > 80%
   - Memory > 85%
   - Disk space < 10% available
3. Configure notifications via email or SNS

### Monitor Application Performance

Add Sentry or similar error tracking. In `.env.prod`, add:

```bash
SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

Then visit your Sentry dashboard to monitor errors.

---

## Troubleshooting

### Cannot SSH into Instance

**Problem:** `Permission denied` or `connection refused`.

**Solution:**

1. Verify the instance is running:
   ```bash
   oci compute instance get --instance-id YOUR_INSTANCE_ID --region ap-sydney-1
   ```

2. Check SSH key permissions:
   ```bash
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

3. Try with verbose output:
   ```bash
   ssh -v -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP
   ```

4. Wait 2–3 minutes after provisioning (init script may be running).

### Docker Services Won't Start

**Problem:** `docker-compose up` fails or containers immediately exit.

**Solution:**

1. Check logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. Verify all environment variables are set:
   ```bash
   cat .env.prod | grep -E "API_KEY|SECRET"
   ```

3. Check disk space:
   ```bash
   df -h
   ```

4. If out of space, clean up Docker:
   ```bash
   docker system prune -a
   ```

### Cannot Access Application via Domain

**Problem:** Browser shows `ERR_NAME_NOT_FOUND` or times out.

**Solution:**

1. Wait for DNS propagation (5–30 minutes):
   ```bash
   nslookup api.your-domain.com
   ```

2. Check that Nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

3. Verify Nginx configuration:
   ```bash
   sudo nginx -t
   ```

4. Check that backend is accessible locally:
   ```bash
   curl http://localhost:8000/health
   ```

5. Review Nginx error logs:
   ```bash
   sudo tail -50 /var/log/nginx/error.log
   ```

### High CPU or Memory Usage

**Problem:** Application is slow or unresponsive.

**Solution:**

1. Check which service is consuming resources:
   ```bash
   docker stats
   ```

2. View logs for errors:
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

3. Check database query performance:
   ```bash
   # SSH into database VM or use remote tools
   # to profile slow queries
   ```

4. Scale the instance:
   ```bash
   # In Oracle Cloud Console, resize the instance to more OCPUs
   ```

### SSL Certificate Renewal

Let's Encrypt certificates expire after 90 days. Certbot auto-renews, but you can manually check:

```bash
sudo certbot renew --dry-run
sudo certbot renew
```

To verify renewal is working, check cron job:

```bash
sudo crontab -l | grep certbot
```

### Database Connection Issues

**Problem:** Backend can't connect to Supabase or external database.

**Solution:**

1. Verify credentials in `.env.prod`:
   ```bash
   grep "SUPABASE" .env.prod
   ```

2. Test connectivity:
   ```bash
   curl https://YOUR_SUPABASE_URL/health
   ```

3. Check database logs in Supabase Dashboard: https://supabase.com/dashboard

4. Ensure your VM's security group allows outbound traffic to external databases.

### Application Crashes After Deploy

**Problem:** Application starts but then crashes.

**Solution:**

1. Check logs immediately:
   ```bash
   docker-compose -f docker-compose.prod.yml logs --tail=100
   ```

2. Verify all required environment variables are set:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend env | grep REQUIRED_VAR
   ```

3. Check for schema migration errors (if using Alembic):
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
   ```

4. Restart services:
   ```bash
   docker-compose -f docker-compose.prod.yml restart backend
   ```

---

## Cleanup

### Stop the Application

```bash
docker-compose -f docker-compose.prod.yml down
```

### Destroy All Infrastructure

**Warning:** This will delete the VM, network, and all data. Only do this if you want to remove everything.

```bash
cd deploy/terraform
terraform destroy
```

When prompted, type `yes` to confirm.

Terraform will delete:
- Compute instance
- VCN and subnet
- Internet gateway
- Security list

**Data volumes** are deleted only if you explicitly added `-auto-approve` or confirmed.

### Manually Clean Up (if Terraform Fails)

If Terraform destroy doesn't work, manually delete resources via Oracle Cloud Console:

1. Go to **Compute** → **Instances**
2. Click on `talkbyte-backend` and click **Terminate**
3. Go to **Networking** → **Virtual Cloud Networks**
4. Delete `talkbyte-vcn` and related resources

---

## Advanced: Custom Domain & Multi-Region

### Use a Different Region

Edit `deploy/.env.oracle`:

```bash
export OCI_REGION="us-phoenix-1"  # or any other Oracle Cloud region
```

Then re-run:

```bash
terraform plan
terraform apply
```

Available regions: https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm

### Load Balancing Across Multiple Instances

For higher availability, you can:

1. Create multiple compute instances
2. Use Oracle Cloud Load Balancer
3. Update Nginx to round-robin traffic

This is beyond the scope of this guide. See Oracle Cloud Load Balancer documentation: https://docs.oracle.com/en-us/iaas/Content/NetworkLoadBalancer/home.htm

---

## Getting Help

### Verify Deployment Checklist

- [ ] Oracle Cloud account created
- [ ] API credentials obtained
- [ ] Terraform installed and initialized
- [ ] Infrastructure provisioned successfully
- [ ] SSH access working
- [ ] Environment file (.env.prod) created
- [ ] Docker services running (`docker-compose ps`)
- [ ] Backend health check passing (`curl http://localhost:8000/health`)
- [ ] Frontend accessible (`curl http://localhost:3000`)
- [ ] Domain pointing to instance
- [ ] SSL certificate installed
- [ ] HTTPS working

### Useful Commands

```bash
# View instance details
terraform show

# View infrastructure state
terraform state list

# Check Terraform plan without applying
terraform plan

# Destroy infrastructure
terraform destroy

# SSH into instance
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP

# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check resource usage
docker stats
```

### Support Resources

- Oracle Cloud Documentation: https://docs.oracle.com/iaas/
- Terraform OCI Provider: https://registry.terraform.io/providers/oracle/oci/latest/docs
- Docker Compose Reference: https://docs.docker.com/compose/reference/
- Let's Encrypt Documentation: https://letsencrypt.org/docs/

---

**Last Updated:** 2026-08-30
**Maintained by:** TalkByte Deployment Team
