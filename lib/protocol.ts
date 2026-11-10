/**
 * AetherShare Signaling Protocol
 *
 * A single, versioned, JSON message protocol shared between the browser
 * client and the standalone Node.js signaling server (ws).
 *
 * All messages are UTF-8 JSON. Binary file data never traverses the
 * signaling channel — it flows over RTCDataChannel, encrypted.
 */

export const PROTOCOL_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Client -> Server
// ---------------------------------------------------------------------------

export type CreateRoomMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "create";
  /** Optional client-supplied display name (sanitised server-side). */
  name?: string;
};

export type JoinRoomMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "join";
  room: string;
  /** Optional client-supplied display name (sanitised server-side). */
  name?: string;
};

export type OfferMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "offer";
  room: string;
  target: string;
  sdp: string;
};

export type AnswerMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "answer";
  room: string;
  target: string;
  sdp: string;
};

export type IceMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "ice";
  room: string;
  target: string;
  candidate: RTCIceCandidateInit;
};

export type LeaveMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "leave";
  room: string;
};

export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | OfferMessage
  | AnswerMessage
  | IceMessage
  | LeaveMessage;

// ---------------------------------------------------------------------------
// Server -> Client
// ---------------------------------------------------------------------------

export type RoomCreatedMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "room-created";
  room: string;
  /** ISO timestamp when the room expires. */
  expiresAt: string;
  /** Peer id assigned to the creator. */
  peer: string;
};

export type JoinAcceptedMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "join-accepted";
  room: string;
  peer: string;
  /** The other peer's id, if one is already present. */
  other?: string;
};

export type JoinRejectedMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "join-rejected";
  room: string;
  reason: "full" | "not-found" | "expired" | "invalid-format" | "rate-limited";
};

export type PeerJoinedMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "peer-joined";
  room: string;
  peer: string;
};

export type PeerLeftMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "peer-left";
  room: string;
  peer: string;
};

export type ServerErrorMessage = {
  v: typeof PROTOCOL_VERSION;
  type: "error";
  message: string;
};

export type ServerMessage =
  | RoomCreatedMessage
  | JoinAcceptedMessage
  | JoinRejectedMessage
  | PeerJoinedMessage
  | PeerLeftMessage
  | ServerErrorMessage;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const ROOM_CODE_RE = /^\d{6}$/;

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_RE.test(code);
}

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (raw === null || typeof raw !== "object") return null;
  const msg = raw as Record<string, unknown>;
  if (msg.v !== PROTOCOL_VERSION) return null;
  if (typeof msg.type !== "string") return null;

  switch (msg.type) {
    case "create":
      if (typeof msg.name === "undefined" || typeof msg.name === "string") {
        return { v: PROTOCOL_VERSION, type: "create", name: msg.name };
      }
      return null;
    case "join":
      if (typeof msg.room !== "string" || !isValidRoomCode(msg.room)) return null;
      if (msg.name !== undefined && typeof msg.name !== "string") return null;
      return {
        v: PROTOCOL_VERSION,
        type: "join",
        room: msg.room,
        name: msg.name,
      };
    case "offer":
    case "answer":
      if (typeof msg.room !== "string" || !isValidRoomCode(msg.room)) return null;
      if (typeof msg.target !== "string") return null;
      if (typeof msg.sdp !== "string") return null;
      return {
        v: PROTOCOL_VERSION,
        type: msg.type,
        room: msg.room,
        target: msg.target,
        sdp: msg.sdp,
      } as OfferMessage | AnswerMessage;
    case "ice":
      if (typeof msg.room !== "string" || !isValidRoomCode(msg.room)) return null;
      if (typeof msg.target !== "string") return null;
      if (msg.candidate === null || typeof msg.candidate !== "object") return null;
      return {
        v: PROTOCOL_VERSION,
        type: "ice",
        room: msg.room,
        target: msg.target,
        candidate: msg.candidate as RTCIceCandidateInit,
      };
    case "leave":
      if (typeof msg.room !== "string" || !isValidRoomCode(msg.room)) return null;
      return { v: PROTOCOL_VERSION, type: "leave", room: msg.room };
    default:
      return null;
  }
}

export function parseServerMessage(raw: unknown): ServerMessage | null {
  if (raw === null || typeof raw !== "object") return null;
  const msg = raw as Record<string, unknown>;
  if (msg.v !== PROTOCOL_VERSION) return null;
  if (typeof msg.type !== "string") return null;
  if (!["room-created", "join-accepted", "join-rejected", "peer-joined", "peer-left", "error"].includes(msg.type)) return null;
  return msg as unknown as ServerMessage;
}