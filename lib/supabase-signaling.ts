/**
 * Supabase Realtime Signaling Client for AetherShare
 *
 * Uses Supabase Realtime channels for WebRTC signaling.
 * Room creation/join validation is done client-side with 6-digit codes.
 * Fully compatible with the existing SignalingClient interface.
 */

import type { ClientMessage, ServerMessage } from './protocol'
import { getSupabaseBrowserClient } from './supabase-browser'

export type SignalingEventType =
  | 'connect'
  | 'disconnect'
  | 'reconnect'
  | 'room-created'
  | 'join-accepted'
  | 'join-rejected'
  | 'peer-joined'
  | 'peer-left'
  | 'error'
  | 'message'
  | 'close'

export type SignalingListener = (event: SignalingEventType, data?: unknown) => void

// Generate a random peer ID
function generatePeerId(): string {
  return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate a 6-digit room code
function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export class SupabaseSignalingClient {
  private supabase: any
  private channel: any = null // RealtimeChannel
  private listeners: Set<SignalingListener> = new Set()
  private currentRoom: string | null = null
  public readonly peerId: string = generatePeerId()
  private reconnectAttempts = 0
  private isClosing = false
  private hasJoined = false
  private otherPeerId: string | null = null

  // Message deduplication
  private lastMessageKey = ''
  private lastMessageTime = 0

  constructor() {
    // Use shared Supabase client instance
    this.supabase = getSupabaseBrowserClient()
  }

  connect(): void {
    this.reconnectAttempts = 0
    this.isClosing = false
    // For Supabase, connection is established lazily when we join/create room
    this.emit('connect')
  }

  /**
   * Public async room creation - generates a 6-digit code and subscribes to channel
   */
  async createRoomAsync(name?: string): Promise<void> {
    return this.createRoomInternal(name)
  }

  /**
   * Public async room joining - subscribes to channel for the given room code
   */
  async joinRoomAsync(roomCode: string, name?: string): Promise<void> {
    return this.joinRoomInternal(roomCode, name)
  }

  /**
   * Internal: Create a new room - generates a 6-digit code and subscribes to channel
   */
  private async createRoomInternal(name?: string): Promise<void> {
    const roomCode = generateRoomCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Set up Realtime channel for this room
    await this.ensureChannel(roomCode)
    this.currentRoom = roomCode
    this.hasJoined = true
    this.otherPeerId = null

    // Broadcast our presence to the channel
    this.broadcastPresence()

    // Emit events for WebRTC manager
    this.emit('room-created', {
      v: 1,
      type: 'room-created',
      room: roomCode,
      expiresAt,
      peer: this.peerId
    })

    this.emit('join-accepted', {
      v: 1,
      type: 'join-accepted',
      room: roomCode,
      peer: this.peerId,
      other: undefined
    })
  }

  /**
   * Internal: Join an existing room
   */
  private async joinRoomInternal(roomCode: string, name?: string): Promise<void> {
    if (!roomCode || !/^\d{6}$/.test(roomCode)) {
      const reason = 'invalid' as const
      this.emit('error', 'Invalid room code')
      this.emit('join-rejected', {
        v: 1,
        type: 'join-rejected',
        room: roomCode,
        reason
      })
      return
    }

    // Set up channel
    await this.ensureChannel(roomCode)
    this.currentRoom = roomCode
    this.hasJoined = true
    this.otherPeerId = null

    // Wait a bit for any existing peer's presence to arrive
    await new Promise(resolve => setTimeout(resolve, 100))

    this.emit('join-accepted', {
      v: 1,
      type: 'join-accepted',
      room: roomCode,
      peer: this.peerId,
      other: undefined
    })

    // Broadcast our presence - this triggers the other peer's detection
    this.broadcastPresence()
  }

  private broadcastPresence(): void {
    if (!this.channel || !this.currentRoom) return

    this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: {
        v: 1,
        type: 'peer-joined',
        room: this.currentRoom,
        peer: this.peerId
      }
    })
  }

  private async ensureChannel(roomCode: string): Promise<void> {
    // Unsubscribe from existing channel
    if (this.channel) {
      try {
        await this.channel.unsubscribe()
      } catch (e) {
        // Continue anyway
      }
    }

    // Create new channel using room code as part of the name
    const channelName = `room_${roomCode}`
    const channel = this.supabase.channel(channelName)

    // Listen for broadcasting messages
    channel.on('broadcast', { event: 'signaling' }, (payload: any) => {
      const msg = payload?.payload
      if (msg) {
        this.handleMessage(msg)
      }
    })

    // Subscribe to the channel and wait for subscription
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('Channel subscription timed out, proceeding anyway')
        resolve()
      }, 5000)

      channel.subscribe((status: string, err?: Error) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          resolve()
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          clearTimeout(timeout)
          reject(err || new Error(`Channel subscription failed: ${status}`))
        }
      })
    })

    this.channel = channel
  }

  private handleMessage(data: any): void {
    if (!data || typeof data !== 'object') return

    // Ignore messages sent by ourselves
    if (data.from === this.peerId || (data.peer === this.peerId && data.type !== 'join-accepted')) {
      return
    }

    // Only process messages for our room
    if (data.room !== this.currentRoom) return

    // If targeted to a specific peer, ignore if not intended for us
    if (data.target && data.target !== this.peerId) {
      return
    }

    // Deduplication: allow ICE candidates, but deduplicate state messages
    if (data.type !== 'ice') {
      const key = `${data.type}-${data.room || ''}-${data.peer || data.from || ''}`
      const now = Date.now()

      if (key === this.lastMessageKey && now - this.lastMessageTime < 500) {
        return // Skip duplicate
      }
      this.lastMessageKey = key
      this.lastMessageTime = now
    }

    switch (data.type) {
      case 'room-created':
        this.emit('room-created', data)
        break
      case 'join-accepted':
        this.emit('join-accepted', data)
        break
      case 'join-rejected':
        this.emit('join-rejected', data)
        break
      case 'peer-joined': {
        const m = data as any
        if (m.peer === this.peerId) return // Ignore our own presence

        if (this.otherPeerId === null) {
          this.otherPeerId = m.peer
        }

        // If this presence was not already a reply, reply with our own presence
        // so the newcomer immediately learns our peer ID as well!
        if (this.hasJoined && !m.isReply && this.channel && this.currentRoom) {
          this.channel.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
              v: 1,
              type: 'peer-joined',
              room: this.currentRoom,
              peer: this.peerId,
              isReply: true
            }
          })
        }

        this.emit('peer-joined', data)
        break
      }
      case 'peer-left': {
        const m = data as any
        if (m.peer === this.peerId) return // Ignore our own leave

        if (m.peer === this.otherPeerId) {
          this.otherPeerId = null
          this.emit('peer-left', data)
        }
        break
      }
      case 'offer':
      case 'answer':
      case 'ice':
        // SDP/ICE messages - forward to WebRTCManager
        this.emit('message', data)
        break
      case 'error':
        this.emit('error', (data as any).message || 'Server error')
        break
      default:
        this.emit('message', data)
    }
  }

  send(message: ClientMessage): boolean {
    switch (message.type) {
      case 'create':
        void this.createRoomInternal(message.name)
        return true

      case 'join':
        void this.joinRoomInternal(message.room, message.name)
        return true

      case 'offer':
      case 'answer':
      case 'ice':
        if (!this.channel || !this.currentRoom) return false
        this.channel.send({
          type: 'broadcast',
          event: 'signaling',
          payload: message
        })
        return true

      case 'leave':
        this.leaveRoom(message.room)
        return true

      default:
        return false
    }
  }

  leaveRoom(room: string): ClientMessage {
    // Notify other peer
    if (this.hasJoined && this.channel && this.currentRoom) {
      this.channel.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          v: 1,
          type: 'peer-left',
          room: this.currentRoom,
          peer: this.peerId
        }
      })
    }

    // Clean up channel
    if (this.channel) {
      try {
        this.channel.unsubscribe()
      } catch (e) {
        // Continue anyway
      }
      this.channel = null
    }

    this.currentRoom = null
    this.hasJoined = false
    this.otherPeerId = null
    this.lastMessageKey = ''
    this.lastMessageTime = 0

    this.emit('close')

    return {
      v: 1,
      type: 'leave',
      room
    }
  }

  close(): void {
    this.isClosing = true
    if (this.currentRoom) {
      this.leaveRoom(this.currentRoom)
    }
    this.reconnectAttempts = 0
  }

  get readyState(): number {
    // WebSocket constants: 1 = OPEN, 3 = CLOSED
    return this.channel ? 1 : 3
  }

  addListener(listener: SignalingListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: SignalingEventType, data?: unknown): void {
    this.listeners.forEach(listener => listener(event, data))
  }

  // Message builder methods (same interface as WebSocket client)
  createRoom(name?: string): ClientMessage {
    const msg: ClientMessage = {
      v: 1,
      type: 'create'
    }
    if (name) (msg as any).name = name
    return msg
  }

  joinRoom(roomCode: string, name?: string): ClientMessage {
    const msg: ClientMessage = {
      v: 1,
      type: 'join',
      room: roomCode
    }
    if (name) (msg as any).name = name
    return msg
  }

  sendOffer(room: string, target: string, sdp: string): ClientMessage {
    return {
      v: 1,
      type: 'offer',
      room,
      target,
      from: this.peerId,
      sdp
    } as any
  }

  sendAnswer(room: string, target: string, sdp: string): ClientMessage {
    return {
      v: 1,
      type: 'answer',
      room,
      target,
      from: this.peerId,
      sdp
    } as any
  }

  sendIce(room: string, target: string, candidate: RTCIceCandidateInit): ClientMessage {
    return {
      v: 1,
      type: 'ice',
      room,
      target,
      from: this.peerId,
      candidate
    } as any
  }

  leaveRoomMsg(room: string): ClientMessage {
    return {
      v: 1,
      type: 'leave',
      room
    }
  }
}