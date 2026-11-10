#!/usr/bin/env node

/**
 * AetherShare Signaling Server
 *
 * A standalone WebSocket server for WebRTC signaling.
 * This server only relays signaling messages - it does NOT
 * store or process file data.
 */

const WebSocket = require("ws");
const http = require("http");
const url = require("url");
const { RoomManager } = require("./room-manager");
const {
  isValidRoomCode,
  parseClientMessage,
  parseServerMessage,
  PROTOCOL_VERSION,
} = require("./protocol");

const PORT = process.env.SIGNALING_PORT || 8080;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",");
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB max message size

// Rate limiting
const rateLimits = new Map(); // clientId -> { count, resetTime }
const CREATE_RATE_LIMIT = 10; // per minute
const JOIN_RATE_LIMIT = 30; // per minute

const roomManager = new RoomManager();

/**
 * Create HTTP server for WebSocket upgrades
 */
const server = http.createServer((req, res) => {
  // Handle HTTP fallback (for debugging)
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: Date.now() }));
    return;
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("AetherShare Signaling Server - Use WebSocket");
});

/**
 * Create WebSocket server
 */
const wss = new WebSocket.Server({
  server,
  maxPayload: MAX_MESSAGE_SIZE,
});

wss.on("connection", (ws, req) => {
  const clientId = generateClientId();
  const origin = req.headers.origin || "";
  const clientInfo = { ws, id: clientId };
  let isHandshaked = false;

  // Check origin
  if (!isOriginAllowed(origin)) {
    console.warn(`Blocked connection from origin: ${origin}`);
    ws.close(1008, "Origin not allowed");
    return;
  }

  console.log(`Client ${clientId} connected`);

  ws.on("message", (data) => {
    if (!isHandshaked) {
      isHandshaked = true;
    }

    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (e) {
      console.log(`Invalid JSON from ${clientId}:`, e);
      ws.send(JSON.stringify({
        v: PROTOCOL_VERSION,
        type: "error",
        message: "Invalid JSON",
      }));
      return;
    }

    // Validate protocol version
    if (message.v !== PROTOCOL_VERSION) {
      ws.send(JSON.stringify({
        v: PROTOCOL_VERSION,
        type: "error",
        message: `Unsupported protocol version: ${message.v}`,
      }));
      return;
    }

    // Process message
    handleClientMessage(clientId, ws, message);
  });

  ws.on("close", () => {
    console.log(`Client ${clientId} disconnected`);
    handleClientDisconnect(clientId);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error for ${clientId}:`, err.message);
  });
});

/**
 * Handle client messages
 */
function handleClientMessage(clientId, ws, message) {
  const msg = parseClientMessage(message);
  if (!msg) {
    ws.send(JSON.stringify({
      v: PROTOCOL_VERSION,
      type: "error",
      message: "Invalid message format",
    }));
    return;
  }

  const roomCode = msg.room;

  // Validate room code for relevant operations
  if (["offer", "answer", "ice"].includes(msg.type) && roomCode) {
    if (!isValidRoomCode(roomCode)) {
      ws.send(JSON.stringify({
        v: PROTOCOL_VERSION,
        type: "error",
        message: "Invalid room code",
      }));
      return;
    }
  }

  switch (msg.type) {
    case "create": {
      const host = { id: clientId, ws, name: msg.name };
      const result = roomManager.createRoom(host);

      if (result) {
        const response = {
          v: PROTOCOL_VERSION,
          type: "room-created",
          room: result.room,
          expiresAt: result.expiresAt,
          peer: result.peer,
        };
        ws.send(JSON.stringify(response));
        console.log(`Room ${result.room} created by ${clientId}`);
      } else {
        ws.send(JSON.stringify({
          v: PROTOCOL_VERSION,
          type: "error",
          message: "Unable to create room (max rooms reached)",
        }));
      }
      break;
    }

    case "join": {
      const joiner = { id: clientId, ws, name: msg.name };
      const result = roomManager.joinRoom(roomCode, joiner);

      if (result.error) {
        const response = {
          v: PROTOCOL_VERSION,
          type: "join-rejected",
          room: roomCode,
          reason: result.error,
        };
        ws.send(JSON.stringify(response));
        console.log(`Join rejected for ${clientId} in ${roomCode}: ${result.error}`);
      } else {
        // Notify existing peer
        const existingPeer = roomManager.getRoom(roomCode)?.getOtherPeer(clientId);
        if (existingPeer?.ws) {
          existingPeer.ws.send(JSON.stringify({
            v: PROTOCOL_VERSION,
            type: "peer-joined",
            room: roomCode,
            peer: clientId,
          }));
        }

        const response = {
          v: PROTOCOL_VERSION,
          type: "join-accepted",
          room: result.room,
          peer: result.peer,
          other: result.other,
        };
        ws.send(JSON.stringify(response));
        console.log(`Peer ${clientId} joined room ${roomCode}`);
      }
      break;
    }

    case "offer": {
      if (!isValidRoomCode(roomCode)) {
        ws.send(JSON.stringify({
          v: PROTOCOL_VERSION,
          type: "error",
          message: "Invalid room code",
        }));
        return;
      }
      // Forward offer to target peer
      roomManager.sendTo(roomCode, msg.target, {
        v: PROTOCOL_VERSION,
        type: "offer",
        room: roomCode,
        target: clientId,
        sdp: msg.sdp,
      });
      break;
    }

    case "answer": {
      if (!isValidRoomCode(roomCode)) {
        ws.send(JSON.stringify({
          v: PROTOCOL_VERSION,
          type: "error",
          message: "Invalid room code",
        }));
        return;
      }
      // Forward answer to target peer
      roomManager.sendTo(roomCode, msg.target, {
        v: PROTOCOL_VERSION,
        type: "answer",
        room: roomCode,
        target: clientId,
        sdp: msg.sdp,
      });
      break;
    }

    case "ice": {
      if (!isValidRoomCode(roomCode)) {
        ws.send(JSON.stringify({
          v: PROTOCOL_VERSION,
          type: "error",
          message: "Invalid room code",
        }));
        return;
      }
      // Forward ICE candidate to target peer
      roomManager.sendTo(roomCode, msg.target, {
        v: PROTOCOL_VERSION,
        type: "ice",
        room: roomCode,
        target: clientId,
        candidate: msg.candidate,
      });
      break;
    }

    case "leave": {
      if (roomCode && roomManager.getRoom(roomCode)) {
        const room = roomManager.getRoom(roomCode);
        const otherPeer = room?.getOtherPeer(clientId);

        // Notify other peer
        if (otherPeer?.ws) {
          otherPeer.ws.send(JSON.stringify({
            v: PROTOCOL_VERSION,
            type: "peer-left",
            room: roomCode,
            peer: clientId,
          }));
        }

        roomManager.leaveRoom(roomCode, clientId);
        console.log(`Peer ${clientId} left room ${roomCode}`);
      }
      break;
    }

    default:
      console.warn(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle client disconnect
 */
function handleClientDisconnect(clientId) {
  // Find and notify room
  for (const [code, room] of roomManager.rooms) {
    const peer = room.getPeer(clientId);
    if (peer) {
      const otherPeer = room.getOtherPeer(clientId);

      // Notify other peer
      if (otherPeer?.ws) {
        otherPeer.ws.send(JSON.stringify({
          v: PROTOCOL_VERSION,
          type: "peer-left",
          room: code,
          peer: clientId,
        }));
      }

      roomManager.leaveRoom(code, clientId);
      console.log(`Peer ${clientId} left room ${code}`);
    }
  }
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin) {
  if (ALLOWED_ORIGINS.includes("*")) return true;
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start server
 */
server.listen(PORT, () => {
  console.log(`AetherShare Signaling Server running on port ${PORT}`);
  console.log(`WS Endpoint: ws://localhost:${PORT}`);
  console.log("Signaling only - no file data passes through this server");
});

// Graceful shutdown
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function shutdown() {
  console.log("\nShutting down...");
  roomManager.shutdown();
  wss.close(() => {
    console.log("WebSocket server closed");
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
}