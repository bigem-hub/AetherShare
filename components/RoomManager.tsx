"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { QrCode, Copy, Share2, Link2, User, X } from "lucide-react";
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
  onRename?: (name: string) => void;
}

export function RoomManager({
  roomCode,
  peerId,
  otherPeerId,
  isConnecting,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onRename,
}: RoomManagerProps) {
  const [joinCode, setJoinCode] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when it appears
  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameInput]);

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
      setShowJoinDialog(false);
      setUserName("");
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

  const handleKeyDownCreate = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowNameInput(false);
      setUserName("");
    }
  }, []);

  // Host view - showing room code
  if (roomCode && peerId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-8 backdrop-blur-xl shadow-xl"
      >
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider">
            Room Created
          </h3>
          <div className="mt-3">
            <div className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-teal-500/20 to-violet-500/20 px-5 py-3">
              <span className="font-mono text-3xl font-bold text-teal-400 tracking-wider">
                {roomCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
          >
            <Copy className="h-4 w-4" />
            Copy Code
          </button>

          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
          >
            <Link2 className="h-4 w-4" />
            Copy Link
          </button>

          <button
            onClick={shareViaWebShare}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-violet-600 px-4 py-2 text-sm text-white hover:from-teal-600 hover:to-violet-700 transition-all duration-200 shadow-md"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground/60">
          Waiting for{" "}
          <span className="text-teal-400 font-medium">
            {otherPeerId ? "peer connected" : "another user to join..."}
          </span>
        </div>

        <button
          onClick={onLeaveRoom}
          className="rounded-lg px-5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
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
        className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-8 backdrop-blur-xl shadow-xl"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold">Join a Room</h3>
          <p className="mt-2 text-sm text-muted-foreground/70">
            Enter the 6-digit room code from the other device
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div>
            <input
              ref={nameInputRef}
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-center text-xl font-mono tracking-wider focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {showNameInput && (
            <div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name (optional)"
                onKeyDown={handleKeyDownCreate}
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowJoinDialog(false);
              setJoinCode("");
            }}
            className="rounded-lg px-5 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleJoinRoom}
            disabled={!/^\d{6}$/.test(joinCode)}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200",
              /^\d{6}$/.test(joinCode)
                ? "bg-gradient-to-r from-teal-500 to-violet-600 text-white hover:from-teal-600 hover:to-violet-700 shadow-md"
                : "bg-white/5 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            Connect
          </button>
        </div>

        <div className="flex w-full items-center gap-2 border-t border-white/10 pt-4 text-xs text-muted-foreground/60">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-2">Or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={() => setShowNameInput(!showNameInput)}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
        >
          <User className="h-4 w-4" />
          Add Name
        </button>
      </motion.div>
    );
  }

  // Waiting view - create/join buttons
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold">Transfer Files P2P</h2>
        <p className="mt-3 text-muted-foreground/70">
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

        <button
          onClick={() => setShowJoinDialog(true)}
          className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-lg font-medium text-muted-foreground hover:bg-white/10 transition-all duration-200"
        >
          <Link2 className="h-5 w-5" />
          Join Existing Room
        </button>
      </div>
    </motion.div>
  );
}