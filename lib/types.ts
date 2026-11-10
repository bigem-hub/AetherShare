/**
 * Shared Types for AetherShare
 *
 * Types used across the application.
 */

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export type TransferStatusType =
  | "queued"
  | "preparing"
  | "transferring"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type TransferDirection = "outgoing" | "incoming";

export interface Transfer {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: TransferStatusType;
  direction: TransferDirection;
  progress: number; // 0-100
  transferredBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  startTime: number;
  endTime?: number;
  transferKey: string;
  checksum?: string;
  error?: string;
}

export interface ReceivedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  downloadUrl: string;
  receivedAt: number;
}

export interface TransferFile {
  id: string;
  name: string;
  size: number;
  type: string;
  key: string;
  direction?: TransferDirection;
}

export interface Room {
  code: string;
  createdAt: number;
  expiresAt: number;
  host: string;
  peers: string[];
}

export interface Peer {
  id: string;
  name?: string;
  joinedAt: number;
}

export interface TransferQueueItem {
  id: string;
  file: File;
  status: TransferStatusType;
  progress: number;
  error?: string;
}

export interface ServerConfig {
  signalingUrl: string;
  signalingPort: number;
  roomExpirationMs: number;
  maxPeersPerRoom: number;
  rateLimit: {
    createPerMinute: number;
    joinPerMinute: number;
  };
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export interface FileTransferConfig {
  chunkSize: number;
  maxBufferSize: number;
  timeoutMs: number;
}