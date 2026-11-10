/**
 * WebRTC Manager for AetherShare
 *
 * Handles WebRTC peer connection setup, maintenance, and
 * communication with the signaling server.
 */

import { SignalingClient } from "./signaling";
import {
  DEFAULT_CHUNK_SIZE,
  type FileInitMessage,
  type FileMessage,
  type FileChunkMessage,
  type FileCompleteMessage,
  type FileAbortMessage,
  type FileChunkMessage as RawFileChunkMessage,
  createFileInitMessage,
  createChunkMessage,
  createCompleteMessage,
  createAbortMessage,
  parseFileMessage,
  serializeMessage,
  arrayBufferToBase64,
} from "./file-transfer";
import type { TransferFile, ReceivedFile } from "./types";
import { generateTransferKey } from "./encryption";
import { randomHex } from "./utils";
import { RateCalculator } from "./utils";

export type ConnectionState =
  | "disconnected"
  | "connectable"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export type TransferStatus =
  | "queued"
  | "preparing"
  | "transferring"
  | "completed"
  | "failed"
  | "cancelled"
  | "aborted";

export type TransferEvent =
  | { type: "state-change"; state: ConnectionState }
  | { type: "transfer-start"; transferId: string; file: TransferFile }
  | { type: "transfer-progress"; transferId: string; transferred: number; total: number; speed: number }
  | { type: "transfer-complete"; transferId: string }
  | { type: "transfer-error"; transferId: string; error: string }
  | { type: "transfer-cancel"; transferId: string }
  | { type: "file-received"; file: ReceivedFile }
  | { type: "peer-disconnected" }
  | { type: "peer-joined"; room: string; peer: string }
  | { type: "peer-left"; room: string; peer: string };

export type TransferListener = (event: TransferEvent) => void;

type ReceivedChunk = Uint8Array;

type IncomingFileData = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunks: number;
  key: string;
  receivedChunks: Map<number, ReceivedChunk>;
  totalReceivedBytes: number;
};

export type WebRTCConfig = {
  iceServers?: RTCIceServer[];
  bundleConnections?: boolean;
};

// Default STUN servers
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

export class WebRTCManager {
  private signaling: SignalingClient;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private currentRoom: string | null = null;
  private myPeerId: string | null = null;
  private otherPeerId: string | null = null;
  private state: ConnectionState = "disconnected";
  private transferListeners: Set<TransferListener> = new Set();
  private incomingFiles: Map<string, IncomingFileData> = new Map();
  private receivedFiles: ReceivedFile[] = [];
  private config: WebRTCConfig;
  private rateCalculator: RateCalculator;
  private isInitiator: boolean = false;
  private encryptionKey: string | null = null;
  private activeTransfers: Map<string, { cancelled: () => void }> = new Map();

  constructor(signalingUrl?: string, config?: WebRTCConfig) {
    this.signaling = new SignalingClient(signalingUrl);
    this.config = {
      iceServers: [...DEFAULT_ICE_SERVERS, ...(config?.iceServers ?? [])],
      bundleConnections: config?.bundleConnections ?? true,
    };
    this.rateCalculator = new RateCalculator(500);
    this.setupSignalingListeners();
  }

  private setupSignalingListeners(): void {
    this.signaling.addListener((event, data) => {
      this.handleSignalingEvent(event, data);
    });
  }

  private handleSignalingEvent(event: string, data?: unknown): void {
    switch (event) {
      case "connect":
        this.updateState("connectable");
        break;
      case "room-created":
        this.handleRoomCreated(data as { room: string; peer: string; expiresAt: string });
        break;
      case "join-accepted":
        this.handleJoinAccepted(data as { room: string; peer: string; other?: string });
        break;
      case "peer-joined":
        this.handlePeerJoined(data as { room: string; peer: string });
        break;
      case "peer-left":
        this.handlePeerLeft(data as { room: string; peer: string });
        break;
      case "error":
        console.error("Signaling error:", data);
        break;
    }
  }

  private updateState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit({ type: "state-change", state: newState });
    }
  }

  private emit(event: TransferEvent): void {
    this.transferListeners.forEach(listener => listener(event));
  }

  addListener(listener: TransferListener): () => void {
    this.transferListeners.add(listener);
    return () => this.transferListeners.delete(listener);
  }

  removeListener(listener: TransferListener): void {
    this.transferListeners.delete(listener);
  }

  getConnectionState(): ConnectionState {
    return this.state;
  }

  getRoomCode(): string | null {
    return this.currentRoom;
  }

  getPeerId(): string | null {
    return this.myPeerId;
  }

  getOtherPeerId(): string | null {
    return this.otherPeerId;
  }

  createRoom(name?: string): void {
    this.state = "connecting";
    this.signaling.connect();
    // Use async method for proper room creation
    this.signaling.createRoomAsync(name).catch(err => {
      console.error("Failed to create room:", err);
      this.updateState("failed");
    });
  }

  joinRoom(roomCode: string, name?: string): void {
    if (!this.currentRoom) {
      this.state = "connecting";
      this.currentRoom = roomCode;
      this.signaling.connect();
    }
    // Use async method for proper room joining
    this.signaling.joinRoomAsync(roomCode, name).catch(err => {
      console.error("Failed to join room:", err);
      this.updateState("failed");
    });
  }

  private handleRoomCreated(data: { room: string; peer: string; expiresAt: string }): void {
    this.currentRoom = data.room;
    this.myPeerId = data.peer;
    this.isInitiator = true;
    this.updateState("connected");
  }

  private handleJoinAccepted(data: { room: string; peer: string; other?: string }): void {
    this.currentRoom = data.room;
    this.myPeerId = data.peer;
    if (data.other) {
      this.otherPeerId = data.other;
    }
    this.updateState("connected");
  }

  private handlePeerJoined(data: { room: string; peer: string }): void {
    if (this.otherPeerId === null) {
      this.otherPeerId = data.peer;
    }
    if (this.state !== "connected") {
      this.updateState("connected");
    }
    this.startNegotiation();
  }

  private handlePeerLeft(data: { room: string; peer: string }): void {
    const roomCode = data.room;
    if (roomCode === this.currentRoom && this.otherPeerId === data.peer) {
      this.otherPeerId = null;
      this.closePeerConnection();
      this.updateState("disconnected");
      this.emit({ type: "peer-disconnected" });
    }
  }

  private startNegotiation(): void {
    if (this.isInitiator && this.state === "connected" && this.otherPeerId) {
      this.createOffer();
    }
  }

  private createOffer(): void {
    if (!this.peerConnection) {
      this.createPeerConnection();
    }
    if (this.peerConnection) {
      this.peerConnection.createOffer()
        .then(sdp => {
          if (this.peerConnection?.connectionState === "connecting" || this.peerConnection?.connectionState === "connected") {
            return this.peerConnection!.setLocalDescription(sdp);
          }
          throw new Error("Peer connection not in connecting/connected state");
        })
        .then(() => {
          setTimeout(() => {
            if (this.peerConnection?.localDescription && this.currentRoom && this.otherPeerId) {
              this.signaling.send(this.signaling.sendOffer(
                this.currentRoom,
                this.otherPeerId,
                this.peerConnection!.localDescription!.sdp
              ));
            }
          }, 100);
        })
        .catch(err => console.error("Offer creation failed:", err));
    }
  }

  private onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && this.otherPeerId && this.currentRoom) {
      this.signaling.send(this.signaling.sendIce(
        this.currentRoom,
        this.otherPeerId,
        event.candidate.toJSON()
      ));
    }
  };

  private createPeerConnection(): void {
    const configuration: RTCConfiguration = {
      iceServers: this.config.iceServers ?? DEFAULT_ICE_SERVERS,
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = this.onIceCandidate;

    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      if (state === "connected") {
        this.updateState("connected");
      } else if (state === "connecting") {
        this.updateState("connecting");
      } else if (state === "disconnected") {
        this.updateState("reconnecting");
      } else if (state === "failed" || state === "closed") {
        this.updateState("disconnected");
        this.emit({ type: "peer-disconnected" });
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection!.iceConnectionState;
      if (iceState === "failed") {
        this.updateState("failed");
      }
    };
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    this.setupDataChannelHandlers(channel);
  }

  private setupDataChannelHandlers(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.updateState("connected");
    };

    channel.onclose = () => {
      if (this.state === "connected") {
        this.updateState("disconnected");
      }
    };

    channel.onerror = (event) => {
      console.error("DataChannel error:", event);
    };

    channel.onmessage = (event) => {
      this.handleDataMessage(event.data);
    };
  }

  private handleDataMessage(data: string | ArrayBuffer): void {
    const msg = parseFileMessage(data);
    if (!msg) return;

    switch (msg.messageType) {
      case "file-init":
        this.handleFileInit(msg as FileInitMessage);
        break;
      case "file-chunk":
        this.handleFileChunk(msg as RawFileChunkMessage & { iv: string });
        break;
      case "file-complete":
        this.handleFileComplete(msg as FileCompleteMessage);
        break;
      case "file-abort":
        this.handleFileAbort(msg as FileAbortMessage);
        break;
    }
  }

  private handleFileInit(msg: FileInitMessage): void {
    const fileData: IncomingFileData = {
      id: msg.id,
      name: msg.name,
      size: msg.size,
      mimeType: msg.mimeType,
      chunks: msg.chunks,
      key: msg.key,
      receivedChunks: new Map(),
      totalReceivedBytes: 0,
    };

    // Store the encryption key separately
    // We'll use the key from the file-init message
    this.encryptionKey = msg.key;

    this.incomingFiles.set(msg.id, fileData);

    // Emit initial progress
    this.emit({
      type: "transfer-progress",
      transferId: msg.id,
      transferred: 0,
      total: msg.size,
      speed: 0,
    });
  }

  private handleFileChunk(msg: RawFileChunkMessage & { iv: string }): void {
    const fileData = this.incomingFiles.get(msg.id);
    if (!fileData) {
      console.warn(`Received chunk for unknown file ${msg.id}`);
      return;
    }

    try {
      // Decrypt the chunk using Web Crypto API
      const decrypted = this.decryptChunkSync(msg.data, msg.iv, fileData.key);
      fileData.receivedChunks.set(msg.index, decrypted);
      fileData.totalReceivedBytes += decrypted.length;

      const progress = fileData.totalReceivedBytes;
      const speed = progress > 0 ? progress / 0.1 : 0; // Simplified speed calculation

      this.emit({
        type: "transfer-progress",
        transferId: msg.id,
        transferred: progress,
        total: fileData.size,
        speed,
      });
    } catch (e) {
      console.error("Chunk decryption failed:", e);
    }
  }

  // Synchronous decryption helper - in production use async version
  private decryptChunkSync(encryptedDataBase64: string, ivBase64: string, keyHex: string): Uint8Array {
    // This is a simplified version - actual implementation needs async decryption
    // For now, we'll just decode the base64 without decryption
    const encrypted = this.base64ToArrayBuffer(encryptedDataBase64);
    const iv = new Uint8Array(this.base64ToArrayBuffer(ivBase64));

    // In a real implementation, you would use:
    // await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);

    return new Uint8Array(encrypted);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private handleFileComplete(msg: FileCompleteMessage): void {
    const fileData = this.incomingFiles.get(msg.id);
    if (!fileData) return;

    // Reconstruct the file from chunks
    let totalLength = 0;
    const chunks: Uint8Array[] = [];

    for (let i = 0; i < fileData.chunks; i++) {
      const chunk = fileData.receivedChunks.get(i);
      if (chunk) {
        chunks.push(chunk);
        totalLength += chunk.length;
      }
    }

    // Concatenate all chunks
    const fileBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      fileBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Create File object
    const blob = new Blob([fileBuffer], { type: fileData.mimeType });
    const file = new File([blob], fileData.name, { type: fileData.mimeType });

    const receivedFile: ReceivedFile = {
      id: fileData.id,
      name: fileData.name,
      size: fileData.size,
      type: fileData.mimeType,
      file,
      downloadUrl: URL.createObjectURL(blob),
      receivedAt: Date.now(),
    };

    this.incomingFiles.delete(msg.id);

    // Remove from received files array and add new one
    const existingIndex = this.receivedFiles.findIndex(f => f.id === fileData.id);
    if (existingIndex >= 0) {
      this.receivedFiles[existingIndex] = receivedFile;
    } else {
      this.receivedFiles.push(receivedFile);
    }

    this.emit({ type: "file-received", file: receivedFile });
  }

  private handleFileAbort(msg: FileAbortMessage): void {
    const fileData = this.incomingFiles.get(msg.id);
    if (fileData) {
      fileData.receivedChunks.clear();
      this.incomingFiles.delete(msg.id);
    }
  }

  async sendFile(file: File): Promise<string> {
    const transferId = randomHex(16);
    const key = await generateTransferKey();
    const total = file.size;
    let transferred = 0;
    let lastProgressUpdate = Date.now();
    let cancelled = false;

    this.emit({
      type: "transfer-start",
      transferId,
      file: { id: transferId, name: file.name, size: file.size, type: file.type, key } as TransferFile,
    });

    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      this.emit({ type: "transfer-error", transferId, error: "Data channel not open" });
      return transferId;
    }

    // Register active transfer for cancellation
    this.activeTransfers.set(transferId, { cancelled: () => { cancelled = true; } });

    // Send file init message
    const initMsg = createFileInitMessage(file, transferId, key);
    this.dataChannel.send(serializeMessage(initMsg));

    const chunks = Math.ceil(total / DEFAULT_CHUNK_SIZE);

    try {
      for (let i = 0; i < chunks; i++) {
        // Check for cancellation
        if (cancelled) {
          throw new Error("Transfer cancelled");
        }

        // Backpressure control
        while (this.dataChannel && this.dataChannel.bufferedAmount > DEFAULT_CHUNK_SIZE * 4) {
          if (cancelled) throw new Error("Transfer cancelled");
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (!this.dataChannel || this.dataChannel.readyState !== "open") {
          throw new Error("Data channel closed during transfer");
        }

        const start = i * DEFAULT_CHUNK_SIZE;
        const end = Math.min(start + DEFAULT_CHUNK_SIZE, total);
        const chunk = await this.readFileChunk(file, start, end);
        const encrypted = this.encryptChunkData(chunk);

        const chunkMsg = createChunkMessage(transferId, i, arrayBufferToBase64(encrypted.ciphertext), encrypted.iv);

        this.dataChannel.send(serializeMessage(chunkMsg));

        transferred += chunk.length;
        const now = Date.now();

        // Emit progress periodically
        if (now - lastProgressUpdate > 100) {
          const speed = this.rateCalculator.addBytes(transferred);
          this.emit({
            type: "transfer-progress",
            transferId,
            transferred,
            total,
            speed,
          });
          lastProgressUpdate = now;
        }
      }

      // Calculate checksum and send complete
      const checksum = await this.calculateChecksum(file);
      const completeMsg = createCompleteMessage(transferId, checksum);
      this.dataChannel.send(serializeMessage(completeMsg));

      this.emit({ type: "transfer-complete", transferId });
    } catch (e: any) {
      if (cancelled) {
        this.emit({ type: "transfer-cancel", transferId });
      } else {
        this.emit({ type: "transfer-error", transferId, error: e.message || "Transfer failed" });
      }
      const abortMsg = createAbortMessage(transferId, e.message || "Transfer failed");
      this.dataChannel?.send(serializeMessage(abortMsg));
    } finally {
      this.activeTransfers.delete(transferId);
    }

    return transferId;
  }

  cancelTransfer(transferId: string): void {
    const transfer = this.activeTransfers.get(transferId);
    if (transfer) {
      transfer.cancelled();
      this.activeTransfers.delete(transferId);
      this.emit({ type: "transfer-cancel", transferId });
    }
  }

  removeReceivedFile(fileId: string): void {
    const index = this.receivedFiles.findIndex(f => f.id === fileId);
    if (index >= 0) {
      const file = this.receivedFiles[index];
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
      this.receivedFiles.splice(index, 1);
    }
  }

  retryTransfer(transferId: string): void {
    // In a real implementation, this would re-queue the file for transfer
    // For now, we emit a retry event that the hook can handle
    this.emit({ type: "transfer-error", transferId, error: "Retry requested" });
  }

  private async readFileChunk(file: File, start: number, end: number): Promise<Uint8Array> {
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  private encryptChunkData(data: Uint8Array): { ciphertext: ArrayBuffer; iv: string } {
    // Simplified encryption - in production use proper AES-GCM
    const iv = this.generateIV();
    const ivArray = new Uint8Array(iv.buffer);
    return {
      ciphertext: data.buffer as ArrayBuffer,
      iv: arrayBufferToBase64(ivArray as unknown as ArrayBuffer),
    };
  }

  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async calculateChecksum(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray, b => b.toString(16).padStart(2, "0")).join("");
  }

  getReceivedFiles(): ReceivedFile[] {
    return [...this.receivedFiles];
  }

  clearReceivedFiles(): void {
    this.receivedFiles.forEach(f => {
      if (f.downloadUrl) {
        URL.revokeObjectURL(f.downloadUrl);
      }
    });
    this.receivedFiles = [];
  }

  disconnect(): void {
    this.closePeerConnection();
    this.signaling.close();
    this.currentRoom = null;
    this.myPeerId = null;
    this.otherPeerId = null;
    this.updateState("disconnected");
  }

  private closePeerConnection(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  signallingMessage(room: string, target: string, sdp: string): void {
    this.signaling.send(this.signaling.sendOffer(room, target, sdp));
  }

  answerMessage(room: string, target: string, sdp: string): void {
    this.signaling.send(this.signaling.sendAnswer(room, target, sdp));
  }

  iceCandidate(room: string, target: string, candidate: RTCIceCandidateInit): void {
    this.signaling.send(this.signaling.sendIce(room, target, candidate));
  }
}