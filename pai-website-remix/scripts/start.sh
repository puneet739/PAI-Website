#!/bin/bash

# PAI Website - Complete Startup Script
# This script starts both Docker containers and the dev server

echo "🚀 Starting PAI Website..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start Docker containers
echo "📦 Starting Docker containers (MySQL + Production build)..."
docker compose up -d

# Wait for MySQL to be healthy
echo "⏳ Waiting for MySQL to be ready..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker compose ps mysql | grep -q "healthy"; then
        echo "✅ MySQL is ready!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "   Still waiting... ($elapsed seconds)"
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Error: MySQL failed to start within $timeout seconds"
    exit 1
fi

# Start dev server
echo ""
echo "🔥 Starting development server..."
echo "   Dev server will be available at: http://localhost:5173"
echo "   (or next available port if 5173 is in use)"
echo ""
echo "Press Ctrl+C to stop the dev server (Docker containers will keep running)"
echo ""

npm run dev
