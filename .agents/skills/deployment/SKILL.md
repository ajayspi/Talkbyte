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
  - **Password**: `9700675637Ajkk!@`

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

## Verification
- Monitor the Docker build process in the SSH output.
- Once deployed, verify the live frontend is returning HTTP 200 by checking `http://talkbyte.172.236.176.251.nip.io/`.
