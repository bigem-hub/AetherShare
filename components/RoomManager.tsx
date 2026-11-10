"use client";

import { useState, useCallback } from "react";
import { QrCode, Copy, Share2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RoomManagerProps {
  roomCode: string | null;
  peerId: string | null;
  otherPeerId: string | null;
  isConnecting: boolean;
  onCreateRoom: (name?: string) => void;
  onJoinRoom: (code: string, name?: string) => void;
  onLeaveRoom: () => void;
}

export function RoomManager({
  roomCode,
  peerId,
  otherPeerId,
  isConnecting,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}: RoomManagerProps) {
  const [joinCode, setJoinCode] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState("");

  const handleCreateRoom = useCallback(() => {
    onCreateRoom(userName || undefined);
    setShowNameInput(false);
    setUserName("");
  }, [onCreateRoom, userName]);

  const handleJoinRoom = useCallback(() => {
    const trimmed = joinCode.trim();
    if (/^\d{6}$/.test(trimmed)) {
      onJoinRoom(trimmed, userName || undefined);
      setJoinCode("");
    }
  }, [joinCode, userName, onJoinRoom]);

  const copyCode = useCallback(async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
    }
  }, [roomCode]);

  const copyInviteLink = useCallback(() => {
    if (roomCode) {
      const url = window.location.origin + "?room=" + roomCode;
      navigator.clipboard.writeText(url);
    }
  }, [roomCode]);

  const getInviteUrl = useCallback(() => {
    if (roomCode) {
      return window.location.origin + "?room=" + roomCode;
    }
    return window.location.href;
  }, [roomCode]);

  const shareViaWebShare = useCallback(async () => {
    if (roomCode && navigator.share) {
      try {
        await navigator.share({
          title: "AetherShare File Transfer",
          text: "Join this AetherShare room to transfer files directly",
          url: getInviteUrl(),
        });
      } catch (e) {
        copyInviteLink();
      }
    }
  }, [roomCode, getInviteUrl, copyInviteLink]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  }, [handleJoinRoom]);

  // Host view - showing room code
  if (roomCode && peerId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-6 backdrop-blur-lg"
      >
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground">Room Created</h3>
          <div className="mt-2">
            <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500/20 to-violet-500/20 px-4 py-2">
              <span className="font-mono text-2xl font-bold text-teal-400 tracking-wider">
                {roomCode}
              </span>
              <Copy className="h-4 w-4 text-teal-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy Code
          </button>

          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Copy Link
          </button>

          <button
            onClick={shareViaWebShare}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-teal-500/20 to-violet-500/20 px-3 py-1.5 text-sm text-teal-400 hover:from-teal-500/30 hover:to-violet-500/30 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground/70">
          Waiting for {otherPeerId ? "peer connected" : "another user to join..."}
        </div>

        <button
          onClick={onLeaveRoom}
          className="rounded-md px-4 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Leave Room
        </button>
      </motion.div>
    );
  }

  // Join dialog
  if (showJoinDialog) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-6 backdrop-blur-lg"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold">Join a Room</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit room code from the other device
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="123456"
            maxLength={6}
            className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2 text-center text-lg font-mono tracking-wider focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />

          {showNameInput && (
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-4 py-2 text-sm focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinDialog(false)}
            className="rounded-md px-4 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleJoinRoom}
            disabled={!/^\d{6}$/.test(joinCode)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              /^\d{6}$/.test(joinCode)
                ? "bg-gradient-to-r from-teal-500 to-violet-600 text-white hover:from-teal-600 hover:to-violet-700"
                : "bg-white/5 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            Connect
          </button>
        </div>

        {userName && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: "1.5rem" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground/70"
          >
            <span>Using name:</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-foreground/90">
              {userName}
            </span>
            <button
              onClick={() => setUserName("")}
              className="hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Waiting view - create/join buttons
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold">Transfer Files P2P</h2>
        <p className="mt-2 text-muted-foreground">
          Direct peer-to-peer file transfer using WebRTC
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => setShowNameInput(true)}
          className="flex items-center justify-center gap-3 rounded-xl border border-teal-500/30 bg-gradient-to-b from-teal-900/20 to-transparent px-6 py-4 text-lg font-medium text-teal-300 hover:from-teal-800/30 hover:border-teal-500/50 transition-all duration-200"
        >
          <div className="grid h-6 w-6">
            <div className="rounded-sm shadow-lg shadow-teal-500/30" />
          </div>
          Create New Room
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="flex-1 border-t border-white/10" />
          </div>
          <span className="relative inline-flex items-center justify-center px-2 text-xs text-muted-foreground uppercase tracking-wider">
            Or
          </span>
        </div>

        <button
          onClick={() => setShowJoinDialog(true)}
          className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-lg font-medium text-muted-foreground hover:bg-white/10 transition-colors"
        >
          <Link2 className="h-5 w-5" />
          Join Existing Room
        </button>
      </div>
    </motion.div>
  );
}