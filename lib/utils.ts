/**
 * Utility functions for AetherShare
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a file size in human-readable format (e.g., 1.23 GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  const unit = sizes[i];
  return `${size.toFixed(2)} ${unit}`;
}

/**
 * Format bytes per second to human-readable string
 */
export function formatTransferSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`;
  }
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  const size = bytesPerSecond / Math.pow(k, i);
  const unit = sizes[i];
  return `${size.toFixed(2)} ${unit}`;
}

/**
 * Calculate estimated time remaining based on transferred bytes
 */
export function calculateETA(elapsedMs: number, transferredBytes: number, totalBytes: number): string {
  if (transferredBytes === 0 || elapsedMs === 0) return "--:--";
  const speed = transferredBytes / elapsedMs;
  const remainingBytes = totalBytes - transferredBytes;
  const remainingMs = remainingBytes / speed;

  if (remainingMs < 1000) return "0:00";

  const totalSeconds = Math.round(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Compute a simple hash of a string using Web Crypto API
 * Returns a hex string
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a random hex string of specified byte length
 */
export function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a random string using the Web Crypto API
 */
export function randomString(length: number): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const result = new Array(length);
  const charactersLength = characters.length;
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result[i] = characters[randomValues[i] % charactersLength];
  }
  return result.join("");
}

/**
 * Sanitize a filename by removing or replacing dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const baseName = filename.split(/[/\\]/).pop() ?? filename;
  // Remove null bytes
  let sanitized = baseName.replace(/\0/g, "");
  // Replace characters that could cause issues on various filesystems
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
  // Trim leading/trailing whitespace and dots (common on Windows)
  sanitized = sanitized.trim().replace(/^[\. ]+|[\. ]+$/g, "");
  // Ensure we have a valid filename
  if (sanitized.length === 0) {
    sanitized = "unnamed_file";
  }
  return sanitized;
}

/**
 * Compute a running average of transfer rates
 */
export class RateCalculator {
  private points: { timestamp: number; bytes: number }[] = [];
  private windowMs: number;

  constructor(windowMs: number = 1000) {
    this.windowMs = windowMs;
  }

  addBytes(bytes: number): number {
    const now = Date.now();
    this.points.push({ timestamp: now, bytes });
    // Clean old points
    const cutoff = now - this.windowMs;
    this.points = this.points.filter(p => p.timestamp >= cutoff);
    return this.getCurrentRate();
  }

  getCurrentRate(): number {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const recent = this.points.filter(p => p.timestamp >= cutoff);
    const totalBytes = recent.reduce((sum, p) => sum + p.bytes, 0);
    const totalMs = Math.max(now - (recent[0]?.timestamp ?? now), 1);
    return totalBytes / (totalMs / 1000); // bytes per second
  }

  reset(): void {
    this.points = [];
  }
}

/**
 * Simple throttle function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * Deep comparison of two values (for testing/memoization)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const objA = a as object;
    const objB = b as object;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Promise resolve after timeout
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

/**
 * Get MIME type from file
 */
export function getMimeType(file: File): string {
  return file.type || "application/octet-stream";
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = "id"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${random}`;
}