# Docker Deployment Guide

This guide explains how to deploy AniDigital Harvest Hub using Docker and Portainer.

## Prerequisites

- Docker and Docker Compose installed
- Portainer installed and running
- Environment variables configured (see below)

## Environment Variables

The application requires the following environment variables. Create a `.env` file or configure them in Portainer:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Agromonitoring API Key (optional, for weather features)
VITE_AGROMONITORING_API_KEY=your_agromonitoring_api_key

# Plant.id Crop Health API Key (optional, for Crop Doctor)
VITE_PLANT_ID_API_KEY=your_plant_id_api_key

# Port Configuration (for docker-compose)
PORT=8080
DOMAIN=your-domain.com
```

## Building the Image

### Option 1: Using Docker Compose (Recommended)

```bash
docker-compose build
```

### Option 2: Using Docker directly

```bash
docker build -t anidigital-harvest-hub:latest .
```

## Running with Docker Compose

```bash
docker-compose up -d
```

The application will be available at `http://localhost:8080` (or the port you configured).

## Deploying in Portainer

### Method 1: Using Docker Compose Stack

1. In Portainer, go to **Stacks**
2. Click **Add stack**
3. Name your stack (e.g., `anidigital-harvest-hub`)
4. Copy the contents of `docker-compose.yml` into the web editor
5. Configure environment variables in the **Environment variables** section
6. Click **Deploy the stack**

### Method 2: Using Portainer's Git Repository

1. In Portainer, go to **Stacks**
2. Click **Add stack**
3. Select **Repository**
4. Enter your Git repository URL
5. Set the **Compose path** to `docker-compose.yml`
6. Configure environment variables
7. Click **Deploy the stack**

## Environment Variables in Portainer

When deploying in Portainer, you need to set environment variables. However, note that Vite requires environment variables to be prefixed with `VITE_` and they must be available at **build time**, not runtime.

### Solution: Build-time Environment Variables

Since Vite bundles environment variables at build time, you have two options:

#### Option A: Build with Environment Variables (Recommended)

1. Create a `.env` file with your variables
2. Build the Docker image with the environment variables:
   ```bash
   docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... -t anidigital-harvest-hub .
   ```

#### Option B: Use a Build Script

Modify the Dockerfile to accept build arguments and use them during build:

```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_AGROMONITORING_API_KEY
ARG VITE_PLANT_ID_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_AGROMONITORING_API_KEY=$VITE_AGROMONITORING_API_KEY
ENV VITE_PLANT_ID_API_KEY=$VITE_PLANT_ID_API_KEY
```

Then build with:
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=your_url \
  --build-arg VITE_SUPABASE_ANON_KEY=your_key \
  -t anidigital-harvest-hub .
```

## Health Check

The container includes a health check endpoint at `/health`. Portainer will use this to monitor the container's health.

## Updating the Application

To update the application:

1. Pull the latest changes from Git
2. Rebuild the image: `docker-compose build`
3. Restart the stack: `docker-compose up -d`

Or in Portainer:
1. Go to your stack
2. Click **Editor**
3. Update the stack configuration
4. Click **Update the stack**

## Troubleshooting

### Container won't start

- Check logs: `docker-compose logs web`
- Verify environment variables are set correctly
- Ensure port 8080 (or your configured port) is not in use

### Application shows blank page

- Check browser console for errors
- Verify environment variables were set at build time
- Check nginx logs: `docker-compose logs web`

### Environment variables not working

Remember: Vite environment variables must be available at **build time**. If you need to change them, rebuild the image.

## Nginx Proxy Manager (NPM) Setup

If you're using Nginx Proxy Manager for SSL/HTTPS:

1. Deploy this stack in Portainer
2. In NPM, go to **Proxy Hosts** → **Add Proxy Host**
3. Configure:
   - **Domain Names**: Your domain (e.g., `app.yourdomain.com`)
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `anidigital-harvest-hub` (container name)
   - **Forward Port**: `80`
   - **Block Common Exploits**: ✓ Enabled
   - **Websockets Support**: ✓ Enabled (if needed)
4. Go to **SSL** tab:
   - **SSL Certificate**: Request a new SSL Certificate or use existing
   - **Force SSL**: ✓ Enabled
   - **HTTP/2 Support**: ✓ Enabled
5. Save and your app will be accessible via HTTPS

The container exposes port 80 internally, and NPM handles SSL termination and routing.

## Production Considerations

- Use a reverse proxy (Nginx Proxy Manager, Traefik, Caddy) in front of the container
- Enable HTTPS/SSL via NPM or your reverse proxy
- Set up proper logging and monitoring
- Configure backup strategies for your Supabase database
- Use Docker secrets for sensitive environment variables

