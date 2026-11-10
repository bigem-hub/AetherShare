// Core types
export type { ConnectionStatus, Transfer, TransferStatusType, TransferFile, ReceivedFile, TransferDirection } from "./types";

// Constants
export { DEFAULT_SIGNALING_PORT, DEFAULT_SIGNALING_URL, ROOM_CODE_LENGTH, ROOM_EXPIRATION_MS, MAX_PEERS_PER_ROOM, BUFFERED_AMOUNT_THRESHOLD, RATE_LIMIT, RECONNECT_DELAY_MS, MAX_RECONNECT_ATTEMPTS, AES_KEY_SIZE, IV_SIZE, MAX_FILE_SIZE, DATA_CHANNEL_TIMEOUT_MS, SIGNALING_TIMEOUT_MS } from "./constants";

// Utility functions
export { cn, formatFileSize, formatTransferSpeed, calculateETA, hashString, randomString, randomHex, sanitizeFilename, RateCalculator, throttle, deepEqual, sleep, copyToClipboard, getMimeType, generateId } from "./utils";

// Protocol definitions
export { PROTOCOL_VERSION, isValidRoomCode, parseClientMessage, parseServerMessage } from "./protocol";

// Encoding utilities
export { arrayBufferToBase64, base64ToArrayBuffer } from "./file-transfer";
export { hexToArrayBuffer, arrayBufferToHex } from "./encryption";

// Encryption
export { generateTransferKey, generateEncryptionKey, generateECDHKeyPair, exportPublicKey, importPublicKey, deriveSharedSecret, deriveAESKey, encryptChunk, decryptChunk } from "./encryption";
export type { KeyPair, EncryptionKey, EncryptedMessage } from "./encryption";

// File transfer
export { DEFAULT_CHUNK_SIZE, calculateChecksum, calculateChecksumFromBuffer, createFileInitMessage, createChunkMessage, createCompleteMessage, createAbortMessage, parseFileMessage, serializeMessage, generateTransferId, estimateSpeed } from "./file-transfer";
export type { FileMessage, FileInitMessage, FileChunkMessage, FileCompleteMessage, FileAbortMessage } from "./file-transfer";

// Signaling
export type { PeerInfo, RoomInfo, SignalingEventType, SignalingListener } from "./signaling";
export { SignalingClient } from "./signaling";

// WebRTC Manager
export { WebRTCManager, DEFAULT_ICE_SERVERS } from "./webrtc";
export type { ConnectionState, TransferStatus, TransferEvent, TransferListener, WebRTCConfig } from "./webrtc";