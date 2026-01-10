# Deployment Guide for Portainer

This guide will help you deploy the AniDigital Harvest Hub Next.js application using Portainer.

## Prerequisites

- Portainer installed and running
- Docker and Docker Compose installed on the host
- Access to your Supabase project credentials
- (Optional) API keys for AgroMonitoring and Plant.id

## Step 1: Prepare Environment Variables

Create a `.env` file in your project root with the following variables (see `.env.example` for reference):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_AGROMONITORING_API_KEY=your_agromonitoring_api_key
NEXT_PUBLIC_PLANT_ID_API_KEY=your_plant_id_api_key
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
PORT=3000
```

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Optional:**
- `NEXT_PUBLIC_AGROMONITORING_API_KEY` - For weather/climate features
- `NEXT_PUBLIC_PLANT_ID_API_KEY` - For crop disease diagnosis
- `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` - Enable debug logging (default: false)
- `PORT` - Port to expose the application (default: 3000)

## Step 2: Deploy via Portainer

### Option A: Using Portainer Stacks (Recommended)

1. **Log into Portainer** and navigate to your environment

2. **Go to Stacks** in the left sidebar

3. **Click "Add Stack"**

4. **Fill in the stack details:**
   - **Name**: `anidigital-harvest-hub`
   - **Build method**: Select "Repository"
   - **Repository URL**: `https://github.com/laeyue/anidigital-harvest-hub.git`
   - **Repository reference**: `nextjs-migration` (or `main` if you merged)
   - **Compose path**: `docker-compose.yml`

5. **Add Environment Variables:**
   - Click "Environment variables"
   - Add each variable from your `.env` file:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_AGROMONITORING_API_KEY` (optional)
     - `NEXT_PUBLIC_PLANT_ID_API_KEY` (optional)
     - `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` (optional)
     - `PORT` (optional, default: 3000)

6. **Deploy the stack:**
   - Click "Deploy the stack"
   - Wait for the build to complete (this may take 5-10 minutes on first build)

### Option B: Using Git Repository + Compose File

1. **SSH into your server** or use Portainer's terminal

2. **Clone the repository:**
   ```bash
   git clone https://github.com/laeyue/anidigital-harvest-hub.git
   cd anidigital-harvest-hub
   git checkout nextjs-migration
   ```

3. **Create `.env` file** with your environment variables

4. **In Portainer, go to Stacks > Add Stack**
   - Name: `anidigital-harvest-hub`
   - Build method: Select "Web editor"
   - Copy and paste the contents of `docker-compose.yml`
   - Add environment variables via the Environment Variables section

5. **Deploy the stack**

### Option C: Using Portainer with Dockerfile (Manual Build)

1. **Upload files to your server** (via SCP, SFTP, or git clone)

2. **In Portainer, go to Containers > Add Container**
   - **Name**: `anidigital-harvest-hub`
   - **Image**: Build from Dockerfile (click "build the image")
     - **Dockerfile location**: `/path/to/your/repo/Dockerfile`
     - **Build method**: Dockerfile
   - **Port mapping**: `3000:3000` (or your custom port)
   - **Restart policy**: `Unless stopped`
   - **Environment variables**: Add all `NEXT_PUBLIC_*` variables

## Step 3: Verify Deployment

1. **Check container logs** in Portainer:
   - Go to Containers > `anidigital-harvest-hub` > Logs
   - You should see: `Ready on http://0.0.0.0:3000`

2. **Access the application:**
   - If deployed on default port: `http://your-server-ip:3000`
   - If using custom port: `http://your-server-ip:YOUR_PORT`

3. **Health check:**
   - The container includes a health check that monitors the application

## Step 4: Configure Reverse Proxy (Optional)

If you want to use a domain name with SSL, set up a reverse proxy (Nginx, Traefik, or Caddy):

### Example Nginx Configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Build Fails

- **Check environment variables**: Ensure all required `NEXT_PUBLIC_*` variables are set
- **Check logs**: View build logs in Portainer to see specific errors
- **Check disk space**: Ensure you have enough disk space for the build

### Container Exits Immediately

- **Check logs**: `docker logs anidigital-harvest-hub`
- **Verify build**: Ensure the build completed successfully
- **Check environment variables**: All required variables must be present

### Application Not Accessible

- **Check port mapping**: Ensure the port is correctly mapped and not blocked by firewall
- **Check container status**: Container should be in "Running" state
- **Check logs**: Look for any runtime errors

### Environment Variables Not Working

- **Remember**: `NEXT_PUBLIC_*` variables must be set at **build time** (as build args)
- **Rebuild**: If you change `NEXT_PUBLIC_*` variables, you must rebuild the container
- **Runtime variables**: Non-`NEXT_PUBLIC_*` variables can be set at runtime

## Updating the Application

### Via Portainer Stacks:

1. Go to **Stacks** > `anidigital-harvest-hub`
2. Click **Editor** tab
3. Update the `docker-compose.yml` if needed
4. Click **Update the stack**
5. Portainer will rebuild and redeploy

### Via Git:

1. Pull the latest changes:
   ```bash
   cd /path/to/repo
   git pull origin nextjs-migration
   ```

2. In Portainer, go to **Stacks** > `anidigital-harvest-hub` > **Editor**
3. Click **Update the stack** to rebuild with new changes

## Performance Tips

1. **Use a reverse proxy** with caching for better performance
2. **Enable gzip compression** in your reverse proxy
3. **Monitor resource usage** in Portainer's container stats
4. **Set resource limits** in docker-compose.yml if needed:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

## Security Notes

- Never commit `.env` files to git
- Use Portainer's secret management for sensitive values in production
- Keep your Supabase keys secure
- Regularly update dependencies: `npm audit fix`
- Use environment-specific API keys

## Support

For issues or questions:
- Check the application logs in Portainer
- Review the GitHub repository: https://github.com/laeyue/anidigital-harvest-hub
- Check Next.js documentation: https://nextjs.org/docs

