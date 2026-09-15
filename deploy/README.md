# Deploying TalkByte to Ubuntu

This guide outlines how to deploy the TalkByte system (Next.js frontend + FastAPI backend + Redis/Celery) to a fresh Ubuntu Linux server.

## Prerequisites
- An Ubuntu Server (22.04 LTS or newer recommended).
- A domain name with two A-records pointing to your server's IP address:
  - `@` (e.g., `talkbyte.ai`) for the frontend.
  - `api` (e.g., `api.talkbyte.ai`) for the backend.
- SSH access to your server.

## Step 1: Server Setup (Install Dependencies)

SSH into your server and install Docker, Docker Compose, and Nginx.

```bash
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (so you don't need sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx and Certbot (for SSL)
sudo apt install -y nginx certbot python3-certbot-nginx
```

## Step 2: Clone the Repository

Clone your TalkByte repository to the server. We recommend placing it in `/var/www/` or your user's home directory.

```bash
cd ~
git clone https://github.com/your-org/talkbyte.git
cd talkbyte
```

## Step 3: Configure Environment Variables

You need to provide production credentials for both the frontend and backend.

```bash
# Setup Frontend Env
cp frontend/.env.local.example frontend/.env.local
nano frontend/.env.local

# Setup Backend Env
cp backend/.env.example backend/.env
nano backend/.env
```
*Ensure you update URLs in `.env` to point to your live domains (e.g., `api.yourdomain.com`).*

## Step 4: Configure Nginx (Reverse Proxy)

Copy the provided Nginx template to the Nginx config directory.

```bash
sudo cp deploy/nginx/talkbyte.conf /etc/nginx/sites-available/talkbyte.conf
```

Edit the file to replace `your-domain.com` with your actual domain names.
```bash
sudo nano /etc/nginx/sites-available/talkbyte.conf
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/talkbyte.conf /etc/nginx/sites-enabled/
# Remove default nginx page
sudo rm /etc/nginx/sites-enabled/default
# Test config
sudo nginx -t
# Restart
sudo systemctl restart nginx
```

## Step 5: Secure with SSL (HTTPS)

Run Certbot to automatically fetch SSL certificates and update your Nginx configuration.

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```
*Follow the prompts and choose to redirect HTTP traffic to HTTPS.*

## Step 6: Initial Deployment

Run the deployment script to build and start the Docker containers.

```bash
./deploy/deploy.sh
```

Wait a few minutes for the build process to complete. You can verify the services are running with:
```bash
docker-compose ps
docker-compose logs -f
```

## Continuous Deployment Updates

Whenever you merge new code into your `main` branch, simply SSH into the server and run the script again:

```bash
cd ~/talkbyte
./deploy/deploy.sh
```

*Note: For fully automated deployments, you can set up a GitHub Actions workflow that executes this script via SSH on push to main.*
