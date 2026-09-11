#!/bin/bash

# TalkByte AI - Production Deployment Script
# This script should be run from the root of the repository on the Ubuntu server.

set -e

echo "🚀 Starting TalkByte Deployment..."

# 1. Pull latest code
echo "📦 Pulling latest changes from git..."
git pull origin main

# 2. Check if .env files exist
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found! Please create it from frontend/.env.local.example"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found! Please create it from backend/.env.example"
    exit 1
fi

# 3. Build and restart Docker containers
echo "🐳 Building and restarting Docker containers..."
docker-compose down
docker-compose up -d --build

# 4. Clean up old images to save disk space
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "✅ Deployment complete! Services are restarting."
echo "Use 'docker-compose logs -f' to view logs."
