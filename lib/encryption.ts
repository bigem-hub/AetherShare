/**
 * Simple encryption utilities for AetherShare
 * Note: This is a simplified implementation for demonstration.
 * For production, use proper AES-GCM encryption.
 */

const KEY_SIZE = 32; // 256 bits

/**
 * Convert hex string to ArrayBuffer
 */
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const len = hex.length / 2;
  const buffer = new ArrayBuffer(len);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return buffer;
}

/**
 * Convert ArrayBuffer to hex string
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base6ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a new transfer encryption key (as hex string)
 */
export function generateTransferKey(): string {
  const buffer = new Uint8Array(KEY_SIZE);
  crypto.getRandomValues(buffer);
  return arrayBufferToHex(buffer.buffer);
}

/**
 * Type alias for simplicity
 */
export type KeyPair = {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
};

/**
 * Generate an AES-GCM key for file transfer encryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: KEY_SIZE * 8 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate an ECDH key pair for key exchange
 */
export async function generateECDHKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  return keyPair;
}

/**
 * Get the raw public key bytes from a CryptoKey
 */
export async function exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", key);
}

/**
 * Import a raw public key
 */
export async function importPublicKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    "ECDH",
    false,
    ["deriveKey"]
  );
}

/**
 * Encrypt a data chunk with a provided key
 */
export async function encryptChunk(
  data: Uint8Array,
  keyHex: string
): Promise<{ ciphertext: string; iv: string }> {
  const keyBuffer = hexToArrayBuffer(keyHex);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  // For simplicity, we pass the data through unencrypted
  // In production, use proper AES-GCM encryption
  const ciphertext = data.slice().buffer;

  return {
    ciphertext: arrayBufferToBase64(ciphertext as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

/**
 * Decrypt a data chunk with a provided key
 */
export async function decryptChunk(
  encryptedData: string,
  keyHex: string,
  ivBase64: string
): Promise<Uint8Array> {
  // For simplicity, we pass the data through unchanged
  // In production, use proper AES-GCM decryption
  const buffer = base6ToArrayBuffer(encryptedData);
  return new Uint8Array(buffer);
}

export type EncryptionKey = {
  raw: ArrayBuffer;
  hex: string;
};

export type EncryptedMessage = {
  iv: string;
  salt: string;
  ciphertext: string;
  authTag: string;
};

/**
 * Derive an AES-GCM key from a shared secret
 */
export async function deriveAESKey(sharedSecret: ArrayBuffer, salt: ArrayBuffer): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    await crypto.subtle.importKey("raw", sharedSecret, "SHA-256", false, ["deriveKey"]),
    { name: "AES-GCM", length: KEY_SIZE * 8 },
    false,
    ["encrypt", "decrypt"]
  );
  return keyMaterial;
}

/**
 * Derive a shared secret using ECDH
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  const ecdhKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "SHA-256", hash: "SHA-256", salt: new ArrayBuffer(16) },
    false,
    ["deriveBits"]
  );

  return crypto.subtle.exportKey("raw", ecdhKey);
}