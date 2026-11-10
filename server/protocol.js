/**
 * AetherShare Signaling Protocol (Node.js version)
 * Shared between browser and server
 */

const PROTOCOL_VERSION = 1;

// Room code validation
const ROOM_CODE_RE = /^\d{6}$/;

function isValidRoomCode(code) {
  return ROOM_CODE_RE.test(code);
}

function parseClientMessage(raw) {
  if (raw === null || typeof raw !== "object") return null;
  const msg = raw;
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
      };
    case "ice":
      if (typeof msg.room !== "string" || !isValidRoomCode(msg.room)) return null;
      if (typeof msg.target !== "string") return null;
      if (msg.candidate === null || typeof msg.candidate !== "object") return null;
      return {
        v: PROTOCOL_VERSION,
        type: "ice",
        room: msg.room,
        target: msg.target,
        candidate: msg.candidate,
      };
    case "leave":
      if (typeof msg.room !== "string" || !isValidRoomCode(msg.room)) return null;
      return { v: PROTOCOL_VERSION, type: "leave", room: msg.room };
    default:
      return null;
  }
}

function parseServerMessage(raw) {
  if (raw === null || typeof raw !== "object") return null;
  const msg = raw;
  if (msg.v !== PROTOCOL_VERSION) return null;
  if (typeof msg.type !== "string") return null;
  if (!["room-created", "join-accepted", "join-rejected", "peer-joined", "peer-left", "error"].includes(msg.type)) return null;
  return msg;
}

module.exports = {
  PROTOCOL_VERSION,
  isValidRoomCode,
  parseClientMessage,
  parseServerMessage
};