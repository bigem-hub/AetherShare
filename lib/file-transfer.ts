/**
 * File Transfer Engine for AetherShare
 *
 * Handles efficient streaming of files over RTCDataChannel with
 * backpressure management and integrity verification.
 */

import { generateTransferKey } from "./encryption";

// Default 64KB chunk size
export const DEFAULT_CHUNK_SIZE = 64 * 1024;

export type FileMessage =
  | FileInitMessage
  | FileChunkMessage
  | FileCompleteMessage
  | FileAbortMessage;

export type FileInitMessage = {
  messageType: "file-init";
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunks: number;
  key: string;
};

export type FileChunkMessage = {
  messageType: "file-chunk";
  id: string;
  index: number;
  data: string;
  iv: string;
};

export type FileCompleteMessage = {
  messageType: "file-complete";
  id: string;
  checksum: string;
};

export type FileAbortMessage = {
  messageType: "file-abort";
  id: string;
  reason: string;
};

/**
 * Calculate checksum of a file using Web Crypto API
 */
export async function calculateChecksum(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Calculate checksum from ArrayBuffer
 */
export async function calculateChecksumFromBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Create a file init message
 */
export function createFileInitMessage(
  file: File,
  transferId: string,
  key: string
): FileInitMessage {
  const sanitizedName = file.name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
  return {
    messageType: "file-init",
    id: transferId,
    name: sanitizedName,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    chunks: Math.ceil(file.size / DEFAULT_CHUNK_SIZE),
    key,
  };
}

/**
 * Create a chunk message
 */
export function createChunkMessage(id: string, index: number, data: string, iv: string): FileChunkMessage {
  return {
    messageType: "file-chunk",
    id,
    index,
    data,
    iv,
  };
}

/**
 * Create a complete message
 */
export function createCompleteMessage(id: string, checksum: string): FileCompleteMessage {
  return {
    messageType: "file-complete",
    id,
    checksum,
  };
}

/**
 * Create an abort message
 */
export function createAbortMessage(id: string, reason: string): FileAbortMessage {
  return {
    messageType: "file-abort",
    id,
    reason,
  };
}

/**
 * Parse a JSON message from the data channel
 */
export function parseFileMessage(data: string | ArrayBuffer): FileMessage | null {
  try {
    const str = typeof data === "string" ? data : new TextDecoder().decode(data);
    const parsed = JSON.parse(str);
    // Support both messageType and type for compatibility
    const msgType = parsed.messageType || parsed.type;
    if (msgType) {
      parsed.messageType = msgType;
      parsed.type = msgType;
    }
    return parsed as FileMessage;
  } catch {
    return null;
  }
}

/**
 * Serialize a message to send over the data channel
 */
export function serializeMessage(msg: FileMessage): ArrayBuffer {
  const serialized = { ...msg } as Record<string, unknown>;
  // Map type to messageType for serialization
  if ((msg as any).type) {
    serialized.messageType = (msg as any).type;
    delete serialized.type;
  }
  const encoded = new TextEncoder().encode(JSON.stringify(serialized));
  if (encoded.byteOffset === 0 && encoded.byteLength === encoded.buffer.byteLength) {
    return encoded.buffer as ArrayBuffer;
  }
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
}

/**
 * Generate a random transfer ID
 */
export function generateTransferId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Estimate transfer speed
 */
export function estimateSpeed(transferred: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return transferred / (elapsedMs / 1000);
}