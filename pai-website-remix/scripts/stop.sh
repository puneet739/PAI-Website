#!/bin/bash

# PAI Website - Stop Script
# This script stops all Docker containers

echo "🛑 Stopping PAI Website services..."
echo ""

docker compose down

echo ""
echo "✅ All services stopped!"
echo ""
echo "To start again, run:"
echo "   npm run start"
echo ""
