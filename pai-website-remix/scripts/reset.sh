#!/bin/bash

# PAI Website - Reset Script
# This script stops containers and removes all data (fresh start)

echo "🔄 Resetting PAI Website..."
echo ""
echo "⚠️  WARNING: This will delete all database data!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Reset cancelled"
    exit 1
fi

echo ""
echo "🛑 Stopping services and removing volumes..."
docker compose down -v

echo ""
echo "✅ Reset complete! Database has been wiped."
echo ""
echo "To start with fresh data, run:"
echo "   npm run start"
echo ""
