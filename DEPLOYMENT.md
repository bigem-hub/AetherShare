# AetherShare Deployment Guide

## Overview

AetherShare uses WebRTC for peer-to-peer file transfers. WebRTC requires a **signaling server** to exchange SDP offers, answers, and ICE candidates between peers before establishing a P2P connection.

This guide covers two deployment options:

1. **Supabase Realtime** - Serverless signaling using Supabase Realtime channels (no separate server needed)
2. **Dedicated WebSocket Server** - Self-hosted WebSocket server on Railway, Render, or VPS

## Option 1: Supabase Realtime (Recommended)

### Prerequisites
- A Supabase project (free tier available at https://supabase.com)
- Supabase Realtime must be enabled (default in new projects)

### Setup Steps

#### 1. Create a Supabase Project
1. Go to https://supabase.com and sign in
2. Click "New project"
3. Configure your project (region, password, etc.)
4. Note your **Project URL** and **anon key** (Project Settings → API)

#### 2. Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SIGNALING_PROVIDER` | `supabase` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production |

**Important:** Do NOT use the service-role key in the frontend!

#### 3. Deploy

```bash
# From your local repo
vercel --prod
```

#### 4. Test

1. Open https://aethershare-five.vercel.app in two different browser tabs or devices
2. Tab 1: Click "Create Room" - should see a 6-digit room code
3. Tab 2: Enter the room code and click "Join Room"
4. Both tabs should show "Connected" status
5. Test file transfer between peers

---

### How It Works

The Supabase Realtime implementation:

1. **Room Codes**: Generated client-side as 6-digit random numbers
2. **Presence**: Uses Supabase Realtime channels for peer discovery (`room_XXXXXX`)
3. **Signaling**: Offers/Answers/ICE are broadcast on the same channel
4. **WebRTC**: Direct P2P connection after handshake

**Note:** Room codes are not stored server-side in this implementation. For server-authoritative room management with persistent room state, you would need to add database functions and RPC calls.

---

## Option 2: Dedicated WebSocket Server (Fallback)

### Deploy to Railway.app

#### 1. Install Railway CLI
```bash
npm install -g railway
```

#### 2. Login to Railway
```bash
railway login
```

#### 3. Deploy the Signaling Server
```bash
cd /path/to/aethershare
railway init
railway up
```

#### 4. Get the WebSocket URL
Railway will provide a URL like:
`wss://your-service.up.railway.app`

#### 5. Update Environment Variables in Vercel

Set these in Vercel dashboard:
- `NEXT_PUBLIC_SIGNALING_PROVIDER=websocket`
- `NEXT_PUBLIC_SIGNALING_URL=wss://your-service.up.railway.app`

---

## Environment Variables Reference

### Public Variables (safe to expose)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SIGNALING_PROVIDER` | `websocket` or `supabase` | `websocket` | No |
| `NEXT_PUBLIC_SIGNALING_URL` | WebSocket server URL | `ws://localhost:8080` | Yes for websocket |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | - | Yes for supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | - | Yes for supabase |
| `NEXT_PUBLIC_ROOM_EXPIRATION` | Room TTL in ms | `1800000` | No |

### Server-Only Variables (NEVER expose)

| Variable | Description | Default |
|----------|-------------|---------|
| `SIGNALING_PORT` | WebSocket server port | `8080` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |

---

## Troubleshooting

### "Disconnected" status
1. Check browser console for errors
2. Verify WebSocket/Supabase connection in Network tab
3. For Supabase: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Can't join room
1. Verify room code is exactly 6 digits (e.g., 123456)
2. Check that room creator is still connected
3. Ensure both devices are using the same signaling provider

### File transfer fails
1. Both peers must show "Connected" status
2. Check WebRTC stats (chrome://webrtc-internals)
3. STUN servers may need adjustment for your network

### Multiple peers in same room
AetherShare supports exactly 2 peers per room. Attempting to join a full room will result in "Room full" error.

---

## Files Modified for Supabase Integration

1. `lib/supabase-signaling.ts` - New Supabase Realtime signaling client
2. `lib/signaling.ts` - Factory that selects WebSocket or Supabase provider
3. `lib/ws-signaling.ts` - Original WebSocket client (preserved)
4. `.env.example` - Updated with Supabase variables
5. `DEPLOYMENT.md` - This deployment guide
6. `package.json` - Added `@supabase/supabase-js` dependency

---

## SQL Migrations (Optional - for server-authoritative mode)

The following files are provided in `supabase/migrations/` for optional server-authoritative room management:

- `20241110_create_rooms.sql` - Rooms table
- `20241110_create_room_peers.sql` - Peer membership table
- `20241110_create_messages.sql` - Message queue table
- `20241110_create_functions.sql` - RPC functions

**Note:** These are NOT required for the current client-based implementation. They are provided for future enhancements.

---

## Rollback to WebSocket Signaling

To switch back to WebSocket signaling:

1. Update Vercel environment variables:
   ```
   NEXT_PUBLIC_SIGNALING_PROVIDER=websocket
   NEXT_PUBLIC_SIGNALING_URL=wss://your-signaling-server.com
   ```

2. Remove Supabase variables:
   - Remove `NEXT_PUBLIC_SUPABASE_URL`
   - Remove `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Redeploy: `vercel --prod`

---

## Quick Local Development

### Using WebSocket Server (default)
```bash
# Terminal 1: Start signaling server
npm run server

# Terminal 2: Start Next.js dev server
npm run dev
```

### Using Supabase
```bash
# Create .env.local
echo "NEXT_PUBLIC_SIGNALING_PROVIDER=supabase" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# Start dev server
npm run dev
```