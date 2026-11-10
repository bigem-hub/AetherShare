/**
 * usePeerTransfer Hook
 *
 * Custom React hook for managing WebRTC peer transfers.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { WebRTCManager, type ConnectionState, type TransferEvent } from "@/lib/webrtc";
import { formatFileSize, formatTransferSpeed, calculateETA } from "@/lib/utils";
import type { Transfer, ReceivedFile, TransferFile } from "@/lib/types";
import { DEFAULT_SIGNALING_URL } from "@/lib/constants";

export interface UsePeerTransferResult {
  // Connection state
  connectionState: ConnectionState;
  roomCode: string | null;
  peerId: string | null;
  otherPeerId: string | null;
  isConnected: boolean;

  // Transfers
  transfers: Transfer[];
  receivedFiles: ReceivedFile[];

  // Actions
  createRoom: (name?: string) => void;
  joinRoom: (roomCode: string, name?: string) => void;
  leaveRoom: () => void;
  sendFile: (file: File) => Promise<string>;
  downloadFile: (file: ReceivedFile) => void;
  clearReceivedFiles: () => void;
  cancelTransfer: (id: string) => void;
  removeTransfer: (id: string) => void;
  removeReceivedFile: (id: string) => void;
  retryTransfer: (id: string) => void;

  // Status
  error: string | null;
}

export function usePeerTransfer(signalingUrl?: string): UsePeerTransferResult {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [otherPeerId, setOtherPeerId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const managerRef = useRef<WebRTCManager | null>(null);
  const transfersMapRef = useRef<Map<string, Transfer>>(new Map());

  // Initialize manager
  useEffect(() => {
    const manager = new WebRTCManager(signalingUrl ?? DEFAULT_SIGNALING_URL);
    managerRef.current = manager;

    const handleTransferEvent = (event: TransferEvent) => {
      switch (event.type) {
        case "state-change":
          setConnectionState(event.state);
          if (event.state === "connected") {
            setRoomCode(manager.getRoomCode() ?? null);
            setPeerId(manager.getPeerId() ?? null);
            setError(null);
          }
          if (event.state === "disconnected") {
            setOtherPeerId(null);
          }
          if (event.state === "failed") {
            setError("Connection failed");
          }
          break;

        case "peer-joined":
          setOtherPeerId(manager.getOtherPeerId() ?? null);
          break;

        case "peer-left":
          setOtherPeerId(null);
          break;

        case "transfer-start":
          const newTransfer: Transfer = {
            id: event.transferId,
            fileName: event.file.name,
            fileSize: event.file.size,
            fileType: event.file.type,
            status: "preparing",
            direction: "outgoing",
            progress: 0,
            transferredBytes: 0,
            totalBytes: event.file.size,
            speed: 0,
            startTime: Date.now(),
            transferKey: event.file.key,
          };
          transfersMapRef.current.set(event.transferId, newTransfer);
          setTransfers([...transfersMapRef.current.values()]);
          break;

        case "transfer-progress":
          const existing = transfersMapRef.current.get(event.transferId);
          if (existing) {
            const updated = {
              ...existing,
              status: "transferring" as const,
              progress: Math.round((event.transferred / event.total) * 100),
              transferredBytes: event.transferred,
              totalBytes: event.total,
              speed: event.speed,
            };
            transfersMapRef.current.set(event.transferId, updated);
            setTransfers([...transfersMapRef.current.values()]);
          }
          break;

        case "transfer-complete":
          const completed = transfersMapRef.current.get(event.transferId);
          if (completed) {
            const updated = {
              ...completed,
              status: "completed" as const,
              endTime: Date.now(),
            };
            transfersMapRef.current.set(event.transferId, updated);
            setTransfers([...transfersMapRef.current.values()]);
          }
          break;

        case "transfer-error":
          const failed = transfersMapRef.current.get(event.transferId);
          if (failed) {
            const updated = {
              ...failed,
              status: "failed" as const,
              error: event.error,
              endTime: Date.now(),
            };
            transfersMapRef.current.set(event.transferId, updated);
            setTransfers([...transfersMapRef.current.values()]);
            setError(event.error);
          }
          break;

        case "file-received":
          setReceivedFiles(prev => [...prev, event.file]);
          break;

        case "peer-disconnected":
          setOtherPeerId(null);
          setError("Peer disconnected");
          break;
      }
    };

    manager.addListener(handleTransferEvent);

    return () => {
      manager.removeListener(handleTransferEvent);
      manager.disconnect();
    };
  }, [signalingUrl]);

  const createRoom = useCallback((name?: string) => {
    setError(null);
    managerRef.current?.createRoom(name);
  }, []);

  const joinRoom = useCallback((roomCodeInput: string, name?: string) => {
    setError(null);
    managerRef.current?.joinRoom(roomCodeInput.trim(), name);
  }, []);

  const leaveRoom = useCallback(() => {
    managerRef.current?.disconnect();
    setRoomCode(null);
    setPeerId(null);
    setOtherPeerId(null);
    setConnectionState("disconnected");
  }, []);

  const sendFile = useCallback(async (file: File): Promise<string> => {
    if (!managerRef.current) {
      throw new Error("WebRTC manager not initialized");
    }
    return managerRef.current.sendFile(file);
  }, []);

  const downloadFile = useCallback((file: ReceivedFile) => {
    const a = document.createElement("a");
    a.href = file.downloadUrl;
    a.download = file.name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke the URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(file.downloadUrl);
    }, 10000);
  }, []);

  const clearReceivedFiles = useCallback(() => {
    setReceivedFiles([]);
    managerRef.current?.clearReceivedFiles();
  }, []);

  const cancelTransfer = useCallback((id: string) => {
    managerRef.current?.cancelTransfer(id);
    const transfer = transfersMapRef.current.get(id);
    if (transfer) {
      const updated = { ...transfer, status: "cancelled" as const, endTime: Date.now() };
      transfersMapRef.current.set(id, updated);
      setTransfers([...transfersMapRef.current.values()]);
    }
  }, []);

  const removeTransfer = useCallback((id: string) => {
    transfersMapRef.current.delete(id);
    setTransfers([...transfersMapRef.current.values()]);
  }, []);

  const removeReceivedFile = useCallback((id: string) => {
    managerRef.current?.removeReceivedFile(id);
    setReceivedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const retryTransfer = useCallback((id: string) => {
    const transfer = transfersMapRef.current.get(id);
    if (transfer && transfer.status === "failed") {
      const updated = { ...transfer, status: "preparing" as const, error: undefined, progress: 0, transferredBytes: 0 };
      transfersMapRef.current.set(id, updated);
      setTransfers([...transfersMapRef.current.values()]);
      managerRef.current?.retryTransfer(id);
    }
  }, []);

  return {
    connectionState,
    roomCode,
    peerId,
    otherPeerId,
    isConnected: connectionState === "connected",
    transfers,
    receivedFiles,
    createRoom,
    joinRoom,
    leaveRoom,
    sendFile,
    downloadFile,
    clearReceivedFiles,
    cancelTransfer,
    removeTransfer,
    removeReceivedFile,
    retryTransfer,
    error,
  };
}