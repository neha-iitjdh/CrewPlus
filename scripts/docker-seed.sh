#!/bin/bash
# ================================
# Seed Database in Docker
# ================================

echo "🌱 Seeding database..."

# Run seed script inside the backend container
docker-compose exec backend node src/seeds/seedData.js

echo "✅ Database seeded!"
