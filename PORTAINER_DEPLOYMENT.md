# Quick Portainer Deployment Guide

## Prerequisites
- Portainer installed
- Access to your Supabase credentials
- (Optional) API keys for AgroMonitoring and Plant.id

## Step 1: Create Stack in Portainer

1. Login to Portainer
2. Navigate to **Stacks** → **Add Stack**
3. Name it: `anidigital-harvest-hub`

## Step 2: Choose Deployment Method

### Method 1: Git Repository (Recommended)

**Build Method**: Repository
- **Repository URL**: `https://github.com/laeyue/anidigital-harvest-hub.git`
- **Repository reference**: `nextjs-migration`
- **Compose path**: `docker-compose.yml`

### Method 2: Web Editor

Copy the contents of `docker-compose.yml` into the web editor.

## Step 3: Add Environment Variables

Click **Environment variables** and add:

### Required:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional:
```
NEXT_PUBLIC_AGROMONITORING_API_KEY=your_key
NEXT_PUBLIC_PLANT_ID_API_KEY=your_key
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
PORT=3000
```

## Step 4: Deploy

Click **Deploy the stack** and wait for the build to complete (5-10 minutes).

## Step 5: Access Application

Once deployed, access at: `http://your-server-ip:3000`

(Or your custom port if you changed `PORT`)

## Troubleshooting

### View Logs
- Go to **Stacks** → `anidigital-harvest-hub` → **Logs**

### Rebuild
- Go to **Stacks** → `anidigital-harvest-hub` → **Editor** → **Update the stack**

### Common Issues
- **Build fails**: Check all required environment variables are set
- **Container exits**: Check logs for runtime errors
- **Can't access**: Verify port is mapped and firewall allows it

## Updating

1. In Portainer, go to **Stacks** → `anidigital-harvest-hub`
2. Click **Editor** tab
3. If using Git, pull latest: The stack will use the latest commit
4. Click **Update the stack**

---

For detailed instructions, see `DEPLOYMENT.md`

