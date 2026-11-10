/**
 * AetherShare Signaling Client Factory
 *
 * Selects the appropriate signaling implementation based on environment.
 * Supports: 'websocket' (default) and 'supabase' providers.
 */

import type { ClientMessage, ServerMessage } from "./protocol"
import { WebSocketSignalingClient } from "./ws-signaling"
import { SupabaseSignalingClient } from "./supabase-signaling"
import { DEFAULT_SIGNALING_URL } from "./constants"

// Re-export types from protocol for convenience
export type { ClientMessage, ServerMessage } from "./protocol"

// Signaling event types and listener
export type SignalingEventType =
  | "connect"
  | "disconnect"
  | "reconnect"
  | "room-created"
  | "join-accepted"
  | "join-rejected"
  | "peer-joined"
  | "peer-left"
  | "error"
  | "message"
  | "close"

export type SignalingListener = (event: SignalingEventType, data?: unknown) => void

export type PeerInfo = { id: string; name?: string }
export type RoomInfo = {
  room: string
  createdAt: number
  expiresAt: number
  host: PeerInfo
  peers: Map<string, PeerInfo>
}

/**
 * SignalingClient - Factory that selects WebSocket or Supabase based on env
 */
export class SignalingClient {
  private impl: WebSocketSignalingClient | SupabaseSignalingClient
  private provider: 'websocket' | 'supabase'

  constructor(url?: string) {
    const provider = (process.env.NEXT_PUBLIC_SIGNALING_PROVIDER || 'websocket').toLowerCase() as 'websocket' | 'supabase'
    this.provider = provider

    if (provider === 'supabase') {
      try {
        this.impl = new SupabaseSignalingClient()
      } catch (err) {
        console.warn('Failed to initialize Supabase signaling, falling back to WebSocket:', err)
        this.provider = 'websocket'
        this.impl = new WebSocketSignalingClient(url ?? DEFAULT_SIGNALING_URL)
      }
    } else {
      this.impl = new WebSocketSignalingClient(url ?? DEFAULT_SIGNALING_URL)
    }
  }

  connect(): void {
    this.impl.connect()
  }

  addListener(listener: SignalingListener): () => void {
    return this.impl.addListener(listener)
  }

  send(message: ClientMessage): boolean {
    return this.impl.send(message)
  }

  close(): void {
    this.impl.close()
  }

  get readyState(): number {
    return this.impl.readyState
  }

  // Async room creation for Supabase provider
  async createRoomAsync(name?: string): Promise<void> {
    if (this.provider === 'supabase') {
      // For Supabase, directly await the async room creation
      await (this.impl as SupabaseSignalingClient).createRoomAsync(name)
    } else {
      this.impl.send((this.impl as WebSocketSignalingClient).createRoom(name))
    }
  }

  // Async room joining for Supabase provider
  async joinRoomAsync(roomCode: string, name?: string): Promise<void> {
    if (this.provider === 'supabase') {
      // For Supabase, directly await the async room joining
      await (this.impl as SupabaseSignalingClient).joinRoomAsync(roomCode, name)
    } else {
      this.impl.send((this.impl as WebSocketSignalingClient).joinRoom(roomCode, name))
    }
  }

  // Message builder methods (sync, returns message to be sent)
  createRoom(name?: string): ClientMessage {
    return (this.impl as WebSocketSignalingClient).createRoom(name)
  }

  joinRoom(roomCode: string, name?: string): ClientMessage {
    return (this.impl as WebSocketSignalingClient).joinRoom(roomCode, name)
  }

  sendOffer(room: string, target: string, sdp: string): ClientMessage {
    return this.impl.sendOffer(room, target, sdp)
  }

  sendAnswer(room: string, target: string, sdp: string): ClientMessage {
    return this.impl.sendAnswer(room, target, sdp)
  }

  sendIce(room: string, target: string, candidate: RTCIceCandidateInit): ClientMessage {
    return this.impl.sendIce(room, target, candidate)
  }

  leaveRoom(room: string): ClientMessage {
    return this.impl.leaveRoom(room)
  }
}