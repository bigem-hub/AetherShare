/**
 * Constants for AetherShare
 */

export const DEFAULT_SIGNALING_PORT = 8080;
export const DEFAULT_SIGNALING_URL = "ws://localhost:8080";

// Room settings
export const ROOM_CODE_LENGTH = 6;
export const ROOM_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_PEERS_PER_ROOM = 2;

// File transfer settings
// Note: DEFAULT_CHUNK_SIZE is defined in file-transfer.ts
export const BUFFERED_AMOUNT_THRESHOLD = 64 * 1024 * 4; // 4 * chunk size

// Rate limiting
export const RATE_LIMIT = {
  CREATE_PER_MINUTE: 10,
  JOIN_PER_MINUTE: 30,
};

// Connection settings
export const RECONNECT_DELAY_MS = 1000;
export const MAX_RECONNECT_ATTEMPTS = 5;

// Encryption
export const AES_KEY_SIZE = 32; // 256 bits
export const IV_SIZE = 12; // 96 bits for GCM
export const MAX_FILE_SIZE = 100 * 1024 * 1024 * 1024; // 100GB (browser limit)

// Timeouts
export const DATA_CHANNEL_TIMEOUT_MS = 30000;
export const SIGNALING_TIMEOUT_MS = 10000;