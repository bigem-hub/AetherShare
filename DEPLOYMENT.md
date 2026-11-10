# AetherShare Deployment Guide

## Problem
The application at https://aethershare-five.vercel.app shows "Disconnected" because:
1. Vercel serverless functions don't support persistent WebSocket connections
2. No signaling server is currently deployed

## Solution - Option 1: Deploy Signaling Server to Railway.app (Recommended)

### 1. Install Railway CLI
```bash
npm install -g railway
```

### 2. Login to Railway
```bash
railway login
```

### 3. Deploy the Signaling Server
```bash
cd /path/to/aethershare
railway init
railway up
```

### 4. Get the WebSocket URL
After deployment, Railway will provide a URL like:
`wss://your-service.up.railway.app`

### 5. Update Environment Variable
Set `NEXT_PUBLIC_SIGNALING_URL` to your Railway WebSocket URL:
```bash
# Example: wss://aethershare-signaling.up.railway.app
```

### 6. Deploy to Vercel with New Environment Variable
```bash
vercel --env NEXT_PUBLIC_SIGNALING_URL=wss://your-service.up.railway.app
```

## Solution - Option 2: Deploy to Render.com

### 1. Create a New Web Service on Render
- Runtime: Node.js
- Build Command: `npm install`
- Start Command: `node server/server.js`
- Port: 8080

### 2. Add Environment Variables
```
NODE_ENV=production
SIGNALING_PORT=8080
ALLOWED_ORIGINS=*
```

### 3. Get the WebSocket URL
Render will provide a URL like:
`wss://aethershare-signaling.onrender.com`

### 4. Deploy to Vercel with New Environment Variable
Set `NEXT_PUBLIC_SIGNALING_URL` in Vercel dashboard.

## Solution - Option 3: Self-Host on VPS

```bash
# On your VPS
git clone https://github.com/bigem-hub/AetherShare.git
cd AetherShare
npm install
pm2 start server/server.js --name aethershare-signaling
```

Use a domain like `wss://signaling.yourdomain.com` with a WebSocket proxy (nginx/Traefik).

## Solution - Option 4: Use Upstash Redis (Serverless WebSocket)

Upstash provides serverless WebSocket connections using Redis:

1. Create Upstash Redis database at https://upstash.com
2. Use their WebSocket broker

This requires code changes to use Upstash instead of in-memory rooms.

## Quick Start - Local Development

For local testing:
```bash
# Terminal 1: Start signaling server
npm run server

# Terminal 2: Start Next.js dev server
npm run dev
```

The app will connect to `ws://localhost:8080` by default.

## Files Modified

- `lib/constants.ts` - Updated DEFAULT_SIGNALING_URL to use environment variable
- `.env.example` - Added placeholder and deployment instructions
- `Dockerfile` - Added for Railway/Render deployment
- `railway.json` - Added for Railway configuration

## Verification

After deployment, test the signaling server:
```bash
curl https://your-signaling-server.com/health
# Should return: {"status":"ok","timestamp":...}
```

Visit https://aethershare-five.vercel.app - it should now show "Connected".