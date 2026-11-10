# AetherShare

**AetherShare** is a production-ready peer-to-peer file transfer web application built with WebRTC. Transfer files directly between devices without uploading to any server.

[![Demo](https://img.shields.io/badge/demo-online-brightgreen?style=for-the-badge)](https://aethershare.example.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

## 🚀 Features

- **True P2P Transfer**: Files go directly between browsers using WebRTC
- **Dual Signaling Architecture**: Serverless Supabase Realtime channels with automatic standalone WebSocket fallback
- **End-to-End Encryption**: AES-256-GCM encryption with ECDH key exchange
- **Large File Support**: Stream-based transfers up to 100GB (browser dependent)
- **Backpressure Management**: Automatic flow control for smooth transfers
- **Progress Tracking**: Real-time speed, ETA, and progress indicators
- **Cross-Platform**: Works on desktop, tablet, and mobile browsers
- **Responsive Design**: Modern glassmorphic theme with Plus Jakarta Sans & JetBrains Mono typography and Framer Motion animations

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. A modern browser with WebRTC support (Chrome 72+, Firefox 66+, Safari 15+, Edge 79+)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/bigem-hub/AetherShare.git
cd AetherShare

# Install dependencies
npm install

# OR using yarn
yarn install
```

## ⚙️ Configuration

1. Copy the environment file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your settings:
   - Set `NEXT_PUBLIC_SIGNALING_URL` to your signaling server URL
   - Configure STUN/TURN servers for your deployment
   - Adjust rate limits as needed

## 🏃 Running Locally

Open **two terminal windows** - one for the signaling server, one for the frontend.

### Terminal 1: Start the Signaling Server

```bash
# Development mode
npm run server

# OR with auto-reload
npm run server:watch
```

### Terminal 2: Start the Frontend

```bash
npm run dev
```

### Access the Application

- Frontend: http://localhost:3000
- Health check: http://localhost:8080/health

## 🔗 How to Transfer Files

1. **Device A (Sender)**:
   - Open http://localhost:3000
   - Click "Create New Room"
   - Note the 6-digit room code, or click "Show QR" to display the QR code

2. **Device B (Receiver)**:
   - Open http://localhost:3000
   - Enter the room code or scan the QR code
   - Wait for connection to establish

3. **Transfer**:
   - On Device A, drag files into the drop zone or click "Browse files"
   - Transfers appear in real-time with progress, speed, and ETA
   - Received files on Device B appear in the "Received Files" section below

## 📡 Production Deployment

### Frontend (Next.js)

```bash
npm run build
npm start
```

For production, we recommend using a reverse proxy (nginx, Caddy, or CloudFront) to:
- Terminate TLS (HTTPS required for WebRTC)
- Proxy WebSocket traffic to the signaling server
- Serve the Next.js app

### Signaling Server

For production deployment, we recommend:

#### Using PM2 (recommended)

```bash
npm install -g pm2
pm2 start server/server.js --name "aethershare-signaling"
pm2 startup
pm2 save
```

#### Using Docker

```bash
# Build the image
docker build -t aethershare-signaling -f server/Dockerfile .

# Run the container
docker run -d -p 8080:8080 --name aethershare-signaling aethershare-signaling
```

#### Systemd service (Linux)

```ini
# /etc/systemd/system/aethershare.service
[Unit]
Description=AetherShare Signaling Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/aethershare
ExecStart=/usr/bin/node server/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 🔐 Security Architecture

### Encryption

AetherShare implements end-to-end encryption:

1. **Key Generation**: Each session generates a unique 256-bit AES key
2. **Key Exchange**: Keys are exchanged via ECDH ephemeral keys
3. **Encryption**: AES-GCM with 256-bit keys and 96-bit IVs
4. **Authentication**: Authenticated encryption with GCM tag verification

**Important**: The signaling server never sees file contents or encryption keys.

### Signaling Server Security

- **No Data Storage**: The server only relays signaling messages
- **Rate Limiting**: Prevents abuse (configurable)
- **Origin Validation**: CORS restrictions in production
- **Message Validation**: All messages are validated against the protocol schema

### Limitations

- WebRTC requires both peers to be online simultaneously
- NAT traversal depends on STUN/TURN server availability
- Mobile browsers may have stricter WebRTC restrictions

## ⚙️ STUN/TURN Configuration

For production deployments, configure TURN servers for reliable connectivity through NATs and firewalls.

```env
# Example TURN configuration
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun.cloudflare.com:3478
TURN_SERVERS=turn:turn.example.com:3478
TURN_USERNAME=your-username
TURN_CREDENTIAL=your-password
```

Free TURN services for development:
- [Twilio TURN](https://www.twilio.com/docs/stun-turn)
- [Xirsys](https://www.xirsys.com/)

## 🌐 Browser Compatibility

| Browser | WebRTC Support | Notes |
|---------|---------------|-------|
| Chrome 72+ | ✅ Full | Best support |
| Firefox 66+ | ✅ Full | Good support |
| Safari 15+ | ✅ Full | Limited TURN support |
| Edge 79+ | ✅ Full | Chromium-based |
| Mobile Chrome | ✅ Full | Requires user gesture |

## 📊 Performance

- **Chunk Size**: 64KB (configurable)
- **Backpressure**: Uses `bufferedAmount` and `bufferedamountlow` events
- **Streaming**: Files are read incrementally using `File.slice()`
- **Memory**: Never holds entire file in RAM during transfer

## 🔄 WebSocket Message Protocol

```typescript
// Protocol version
const PROTOCOL_VERSION = 1;

// Client -> Server
type CreateRoomMessage = { v: 1; type: "create"; name?: string };
type JoinRoomMessage = { v: 1; type: "join"; room: string; name?: string };
type OfferMessage = { v: 1; type: "offer"; room: string; target: string; sdp: string };
type AnswerMessage = { v: 1; type: "answer"; room: string; target: string; sdp: string };
type IceMessage = { v: 1; type: "ice"; room: string; target: string; candidate: RTCIceCandidateInit };
type LeaveMessage = { v: 1; type: "leave"; room: string };

// Server -> Client
type RoomCreatedMessage = { v: 1; type: "room-created"; room: string; expiresAt: string; peer: string };
type JoinAcceptedMessage = { v: 1; type: "join-accepted"; room: string; peer: string; other?: string };
type JoinRejectedMessage = { v: 1; type: "join-rejected"; room: string; reason: "full" | "not-found" | "expired" };
type PeerJoinedMessage = { v: 1; type: "peer-joined"; room: string; peer: string };
type PeerLeftMessage = { v: 1; type: "peer-left"; room: string; peer: string };
type ServerErrorMessage = { v: 1; type: "error"; message: string };
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build
npm run build

# Run tests (when tests are added)
npm test
```

## 📖 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Security Details](./SECURITY.md)
- [Configuration Reference](./CONFIG.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WebRTC API reference
- [DataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel) specification
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) for encryption