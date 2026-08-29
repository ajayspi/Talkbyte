#!/bin/bash
set -e

# Update system
apt-get update
apt-get install -y docker.io docker-compose git curl wget

# Add current user to docker group
usermod -aG docker ubuntu

# Clone repo and deploy (placeholder)
echo "Deploy script: pull talkbyte repo and docker-compose up"
