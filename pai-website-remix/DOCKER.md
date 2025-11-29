# Docker Deployment Guide

This guide explains how to build and run the PAI Website using Docker.

## Prerequisites

- Docker installed on your system ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start all services (app + MySQL)
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f pai-website
docker-compose logs -f mysql

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

The application will be available at **http://localhost:3000**

The MySQL database will be available at **localhost:3306**

### Option 2: Using Docker Commands

```bash
# Build the Docker image
docker build -t pai-website .

# Run the container
docker run -d -p 3000:3000 --name pai-website pai-website

# View logs
docker logs -f pai-website

# Stop the container
docker stop pai-website

# Remove the container
docker rm pai-website
```

## Docker Build Process

The Dockerfile uses a multi-stage build for optimization:

1. **development-dependencies-env**: Installs all dependencies (including dev dependencies)
2. **production-dependencies-env**: Installs only production dependencies
3. **build-env**: Builds the React Router application
4. **Final stage**: Creates a minimal production image with only necessary files

## Services

The docker-compose setup includes:

1. **pai-website**: The React Router application
   - Port: 3000
   - Depends on MySQL database
   - Auto-restarts on failure

2. **mysql**: MySQL 8.0 database
   - Port: 3306
   - Database: `pai_db`
   - User: `pai_user` / Password: `pai_password`
   - Persistent data storage
   - Health checks enabled

## Database Access

### Connect to MySQL CLI
```bash
docker exec -it pai-mysql mysql -u pai_user -ppai_password pai_db
```

### Database Credentials
```
Host: localhost (from host) or mysql (from app container)
Port: 3306
Database: pai_db
User: pai_user
Password: pai_password
Root Password: root_password
```

See [DATABASE.md](./DATABASE.md) for complete database documentation.

## Environment Variables

You can customize the application by passing environment variables:

```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=mysql://pai_user:pai_password@mysql:3306/pai_db \
  --name pai-website \
  pai-website
```

## Port Configuration

By default, the application runs on port 3000. To use a different port:

```bash
# Map to port 8080 on your host
docker run -d -p 8080:3000 --name pai-website pai-website
```

Or update `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"
```

## Troubleshooting

### View container logs
```bash
docker logs pai-website
```

### Access container shell
```bash
docker exec -it pai-website sh
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check if container is running
```bash
docker ps
```

## Production Deployment

For production deployments, consider:

1. Using a reverse proxy (nginx, Caddy) for SSL/TLS
2. Setting up health checks
3. Configuring proper logging
4. Using Docker secrets for sensitive data
5. Setting resource limits

Example with resource limits:

```yaml
services:
  pai-website:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Clean Up

Remove all containers and images:

```bash
docker-compose down --rmi all
docker system prune -a
```
