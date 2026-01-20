# CrewPlus Docker Setup

This guide explains how to run CrewPlus using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Quick Start

### 1. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values (optional for local development)
```

### 2. Start the Application

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### 3. Seed the Database

```bash
# Run seed script to populate sample data
docker-compose exec backend node src/seeds/seedData.js
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:5000 |
| API Docs | http://localhost:5000/api/docs |
| Health Check | http://localhost:5000/api/health |

## Docker Commands

### Basic Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Rebuild and start
docker-compose up -d --build

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Service Management

```bash
# Restart a specific service
docker-compose restart backend

# Shell into a container
docker-compose exec backend sh
docker-compose exec mongodb mongosh

# Check container status
docker-compose ps
```

## Development Mode

For development with hot-reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# This mounts your local source code so changes reflect immediately
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │   MongoDB    │  │
│  │   (Nginx)    │→→│  (Express)   │→→│  (Database)  │  │
│  │   Port 80    │  │  Port 5000   │  │  Port 27017  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_USERNAME` | MongoDB admin username | `admin` |
| `MONGO_PASSWORD` | MongoDB admin password | `password123` |
| `JWT_SECRET` | Secret key for JWT tokens | (generated) |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost` |
| `REACT_APP_API_URL` | API URL for frontend | `http://localhost:5000/api` |

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check if ports are in use
netstat -an | grep 5000
netstat -an | grep 80
```

### MongoDB connection issues

```bash
# Verify MongoDB is running
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB logs
docker-compose logs mongodb
```

### Frontend can't connect to backend

1. Ensure `REACT_APP_API_URL` is set correctly
2. Check CORS configuration in backend
3. Verify backend is running: `curl http://localhost:5000/api/health`

### Reset everything

```bash
# Stop containers and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Production Deployment

For production, update `.env` with:

1. Strong `JWT_SECRET`
2. Secure `MONGO_PASSWORD`
3. Proper `CLIENT_URL` and `REACT_APP_API_URL`

Consider using:
- Docker Swarm or Kubernetes for orchestration
- External MongoDB (MongoDB Atlas)
- Reverse proxy (Traefik, nginx-proxy)
- SSL/TLS certificates (Let's Encrypt)
