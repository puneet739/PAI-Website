#!/bin/bash

# PAI Website - Docker Only Startup Script
# This script starts only the Docker containers (MySQL + Production build)

echo "🚀 Starting PAI Website (Docker containers only)..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start Docker containers
echo "📦 Starting Docker containers..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker compose ps mysql | grep -q "healthy"; then
        echo "✅ MySQL is ready!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Error: Services failed to start within $timeout seconds"
    exit 1
fi

echo ""
echo "✅ All services are running!"
echo ""
echo "📊 Service URLs:"
echo "   Production app: http://localhost:3000"
echo "   MySQL database: localhost:3306"
echo ""
echo "To view logs:"
echo "   docker compose logs -f"
echo ""
echo "To stop services:"
echo "   docker compose down"
echo ""
