/// <reference types="next" />

// Extend WebSocket types for browser environment
interface Window {
  RTCIceCandidateInit: RTCIceCandidateInit;
}

// Type for IncomingFileData used in webrtc.ts
type IncomingFileData = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunks: number;
  key: string;
  receivedChunks: Map<number, Uint8Array>;
  totalReceivedBytes: number;
};