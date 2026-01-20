#!/bin/bash
# ================================
# Start CrewPlus with Docker
# ================================

echo "🚀 Starting CrewPlus..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update with your values."
fi

# Build and start containers
docker-compose up -d --build

echo ""
echo "✅ CrewPlus is starting!"
echo ""
echo "📍 Frontend: http://localhost"
echo "📍 Backend:  http://localhost:5000"
echo "📍 API Docs: http://localhost:5000/api/docs"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop:      docker-compose down"
