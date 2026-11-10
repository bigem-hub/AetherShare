/**
 * Room Manager for AetherShare Signaling Server
 *
 * Manages room creation, peer joining, and peer lifecycle.
 */

const { isValidRoomCode } = require('./protocol.js');

const ROOM_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_PEERS = 2;

/**
 * Room class representing a transfer room
 */
class Room {
  constructor(code, host) {
    this.code = code;
    this.host = host;
    this.peers = new Map(); // peerId -> peer info
    this.createdAt = Date.now();
    this.expiresAt = Date.now() + ROOM_EXPIRATION_MS;
    this.lastActivity = Date.now();
  }

  addPeer(peerId, info) {
    if (this.peers.size >= MAX_PEERS) {
      return false;
    }
    this.peers.set(peerId, { ...info, joinedAt: Date.now() });
    this.lastActivity = Date.now();
    return true;
  }

  removePeer(peerId) {
    this.peers.delete(peerId);
    this.lastActivity = Date.now();
  }

  getPeer(peerId) {
    return this.peers.get(peerId);
  }

  getOtherPeer(peerId) {
    for (const [id, peer] of this.peers) {
      if (id !== peerId) {
        return peer;
      }
    }
    return null;
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  isActive() {
    return this.peers.size > 0 || this.isExpired();
  }
}

/**
 * Room Manager class
 */
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.maxRooms = 10000;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Generate a random 6-digit room code
   */
  generateRoomCode() {
    let code;
    let attempts = 0;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      attempts++;
    } while (this.rooms.has(code) && attempts < 10);
    return code;
  }

  /**
   * Create a new room with a host peer
   */
  createRoom(host) {
    // Clean up expired rooms first
    this.cleanup();

    if (this.rooms.size >= this.maxRooms) {
      return null;
    }

    const code = this.generateRoomCode();
    const room = new Room(code, host);
    room.addPeer(host.id, { ...host });
    this.rooms.set(code, room);

    return {
      room: code,
      expiresAt: new Date(room.expiresAt).toISOString(),
      peer: host.id,
    };
  }

  /**
   * Find or join a room with a peer
   */
  joinRoom(code, peer) {
    const room = this.rooms.get(code);
    if (!room) {
      return { error: "not-found" };
    }
    if (room.isExpired()) {
      this.rooms.delete(code);
      return { error: "expired" };
    }
    if (room.peers.size >= MAX_PEERS) {
      return { error: "full" };
    }

    const added = room.addPeer(peer.id, { ...peer });
    if (!added) {
      return { error: "full" };
    }

    const other = room.getOtherPeer(peer.id);
    return {
      room: code,
      peer: peer.id,
      other: other ? other.id : null,
    };
  }

  /**
   * Get room info
   */
  getRoom(code) {
    return this.rooms.get(code);
  }

  /**
   * Remove a peer from a room
   */
  leaveRoom(code, peerId) {
    const room = this.rooms.get(code);
    if (!room) return false;

    room.removePeer(peerId);

    // If room is empty, mark for cleanup
    if (room.peers.size === 0) {
      setTimeout(() => {
        if (!this.rooms.get(code)?.peers.size) {
          this.rooms.delete(code);
        }
      }, ROOM_EXPIRATION_MS);
    }

    return true;
  }

  /**
   * Broadcast a message to all peers in a room
   */
  broadcast(code, message, excludePeerId = null) {
    const room = this.rooms.get(code);
    if (!room) return;

    for (const [peerId, peer] of room.peers) {
      if (peerId !== excludePeerId && peer.ws) {
        peer.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Send message to a specific peer in a room
   */
  sendTo(code, targetPeerId, message) {
    const room = this.rooms.get(code);
    if (!room) return;

    const peer = room.getPeer(targetPeerId);
    if (peer?.ws) {
      peer.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send message to a specific peer
   */
  sendToPeer(peerId, message) {
    for (const room of this.rooms.values()) {
      const peer = room.getPeer(peerId);
      if (peer?.ws) {
        peer.ws.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  /**
   * Get all peers in a room
   */
  getPeers(code) {
    const room = this.rooms.get(code);
    return room ? Array.from(room.peers.values()) : [];
  }

  /**
   * Cleanup expired rooms
   */
  cleanup() {
    for (const [code, room] of this.rooms) {
      if (room.isExpired()) {
        this.rooms.delete(code);
      }
    }
  }

  /**
   * Shutdown manager
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
    this.rooms.clear();
  }
}

module.exports = { RoomManager, Room, ROOM_EXPIRATION_MS, MAX_PEERS };