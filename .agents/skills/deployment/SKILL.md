---
name: deployment
description: >-
  Use this skill when you need to deploy the TalkByte application (frontend or backend) to the live server.
---

# TalkByte Deployment Guide

This skill documents the standard deployment runbook for pushing the TalkByte monorepo to the production server.

## Prerequisites
- Authentication is handled via SSH/SFTP.
  - **Host**: `172.236.176.251`
  - **User**: `root`
  - **Password**: `9700675637Ajkk`

## Deployment Steps

If deploying via a Python script, you can use the `deploy_ssh.py` file located in the root of the repository.

1. **Package the Repository:**
   Ensure you zip the local repository while excluding non-essential directories (`node_modules`, `.next`, `__pycache__`, `.git`). The `deploy_ssh.py` uses `tar.exe` for this.

2. **Upload to Server:**
   Connect to `172.236.176.251` using the root credentials and upload the packaged zip file (`talkbyte_deploy.zip`) to `/root/talkbyte_deploy.zip`.

3. **Deploy on Server:**
   Execute the following commands on the remote server:
   ```bash
   rm -rf /root/MoneyPrinterTurbo
   mkdir -p /root/MoneyPrinterTurbo
   unzip -o -q /root/talkbyte_deploy.zip -d /root/MoneyPrinterTurbo
   cd /root/MoneyPrinterTurbo
   docker compose pull
   docker compose up -d --build
   ```

## Troubleshooting: Docker Cache (Stale UI)
When updating static files (like `public/landing.html`) that are baked into the Next.js image, Docker's build context caching may ignore the modified file if the timestamps don't trigger invalidation. 
- **Symptom:** You push changes, but the live site still shows the old UI.
- **Fix:** Connect via SSH and forcefully rebuild without cache:
  ```bash
  cd /root/MoneyPrinterTurbo
  docker compose build --no-cache frontend
  docker compose up -d
  ```

## Verification
- Monitor the Docker build process in the SSH output.
- **Backend/API changes**: Verify by checking `http://talkbyte.172.236.176.251.nip.io/` or hitting the API endpoints.
- **Frontend/UI changes**: NEVER rely solely on fetching the HTML source to verify correctness. A page can return HTTP 200 with all HTML tags present, but have completely broken CSS layout. **Always** use a headless browser tool (e.g., `chrome-devtools-mcp`'s `take_screenshot` or a Playwright python script) to capture a visual screenshot of the live URL. Visually verify the layout integrity before concluding the deployment is successful.

## Pro-Tip: HTML Prototypes
When programmatically updating raw HTML prototypes (e.g., swapping CSS themes):
- Never blindly replace `<style>` blocks with regex, as you may delete structural Flexbox/grid layouts.
- Always assume raw prototypes might be missing closing tags like `</body>` or `</html>`. When injecting scripts (like Three.js), append them to the absolute end of the file rather than doing string replacement on closing tags.

## Server Architecture (Nginx + Docker)
The live server uses Nginx as a reverse proxy on port 80 to route traffic.
- **Nginx Config**: Routes `/api/` to `http://127.0.0.1:8001` (FastAPI) and `/` to `http://127.0.0.1:3000` (Next.js).
- **Docker Ports**: Containers in `docker-compose.yml` MUST bind to `127.0.0.1` (e.g., `127.0.0.1:3000:3000`) instead of exposing ports publicly (e.g., `80:3000` or `0.0.0.0:8001`). Exposing ports publicly will bypass Nginx or cause port conflicts.
