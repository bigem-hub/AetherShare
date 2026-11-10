/**
 * WebSocket Signaling Client for AetherShare
 *
 * Manages the WebSocket connection to the signaling server and
 * sends/receives WebRTC signaling messages.
 */

import type { ClientMessage, ServerMessage } from "./protocol"

export type PeerInfo = {
  id: string
  name?: string
}

export type RoomInfo = {
  room: string
  createdAt: number
  expiresAt: number
  host: PeerInfo
  peers: Map<string, PeerInfo>
}

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

import { DEFAULT_SIGNALING_URL as CONFIG_SIGNALING_URL, RECONNECT_DELAY_MS, MAX_RECONNECT_ATTEMPTS } from "./constants"

const DEFAULT_URL = process.env.NEXT_PUBLIC_SIGNALING_URL || CONFIG_SIGNALING_URL
const RECONNECT_DELAY = RECONNECT_DELAY_MS
const MAX_RECONNECT_ATTEMPTS_LOCAL = MAX_RECONNECT_ATTEMPTS

export const DEFAULT_SIGNALING_URL = DEFAULT_URL

export class WebSocketSignalingClient {
  private ws: WebSocket | null = null
  private url: string
  private listeners: Set<SignalingListener> = new Set()
  private reconnectAttempts = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private isClosing = false

  constructor(url?: string) {
    this.url = url ?? DEFAULT_URL
  }

  private getUrlFromEnv(): string {
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SIGNALING_URL) {
      return process.env.NEXT_PUBLIC_SIGNALING_URL
    }
    return this.url
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Use wss:// for production, ws:// for localhost
      const wsUrl = this.url.startsWith('localhost') || this.url.startsWith('127.')
        ? this.url.replace('ws://', 'ws://')
        : this.url.replace('ws://', 'wss://').replace('wss://wss://', 'wss://')

      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
    } catch (error: any) {
      this.emit("error", error.message || "WebSocket creation failed")
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.isClosing = false
      this.reconnectAttempts = 0
      this.emit("connect")
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.ws.onclose = (event) => {
      this.emit("close", { code: event.code, reason: event.reason })
      if (!this.isClosing) {
        this.handleDisconnect()
      }
    }

    this.ws.onerror = (event) => {
      this.emit("error", event)
    }
  }

  private handleMessage(data: string): void {
    const msg = JSON.parse(data) as ServerMessage

    switch (msg.type) {
      case "room-created":
        this.emit("room-created", msg)
        break
      case "join-accepted":
        this.emit("join-accepted", msg)
        break
      case "join-rejected":
        this.emit("join-rejected", msg)
        break
      case "peer-joined":
        this.emit("peer-joined", msg)
        break
      case "peer-left":
        this.emit("peer-left", msg)
        break
      case "error":
        this.emit("error", msg.message || "Server error")
        break
      default:
        this.emit("message", msg)
    }
  }

  private handleDisconnect(): void {
    if (this.isClosing) return

    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS_LOCAL) {
      this.reconnectAttempts++
      this.emit("reconnect")
      this.reconnectTimeout = setTimeout(() => {
        this.connect()
      }, RECONNECT_DELAY * this.reconnectAttempts)
    } else {
      this.emit("error", "Max reconnection attempts reached")
    }
  }

  private emit(event: SignalingEventType, data?: unknown): void {
    this.listeners.forEach(listener => listener(event, data))
  }

  addListener(listener: SignalingListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  send(message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }
    try {
      this.ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      this.emit("error", error)
      return false
    }
  }

  close(): void {
    this.isClosing = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  // Message sending helpers

  createRoom(name?: string): ClientMessage {
    const msg: ClientMessage = {
      v: 1,
      type: "create",
    }
    if (name) (msg as any).name = name
    return msg
  }

  joinRoom(roomCode: string, name?: string): ClientMessage {
    const msg: ClientMessage = {
      v: 1,
      type: "join",
      room: roomCode,
    }
    if (name) (msg as any).name = name
    return msg
  }

  sendOffer(room: string, target: string, sdp: string): ClientMessage {
    return {
      v: 1,
      type: "offer",
      room,
      target,
      sdp,
    }
  }

  sendAnswer(room: string, target: string, sdp: string): ClientMessage {
    return {
      v: 1,
      type: "answer",
      room,
      target,
      sdp,
    }
  }

  sendIce(room: string, target: string, candidate: RTCIceCandidateInit): ClientMessage {
    return {
      v: 1,
      type: "ice",
      room,
      target,
      candidate,
    }
  }

  leaveRoom(room: string): ClientMessage {
    return {
      v: 1,
      type: "leave",
      room,
    }
  }
}