"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Copy, Share2, Link2, User, X, Check, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const joinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameInput]);

  useEffect(() => {
    if (showJoinDialog && joinInputRef.current) {
      joinInputRef.current.focus();
    }
  }, [showJoinDialog]);

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
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }, [roomCode]);

  const copyInviteLink = useCallback(async () => {
    if (roomCode) {
      const url = `${window.location.origin}?room=${roomCode}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [roomCode]);

  const shareViaWebShare = useCallback(async () => {
    if (roomCode && navigator.share) {
      try {
        await navigator.share({
          title: "AetherShare File Transfer",
          text: `Join room ${roomCode} on AetherShare to send files directly`,
          url: `${window.location.origin}?room=${roomCode}`,
        });
      } catch (e) {
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  }, [roomCode, copyInviteLink]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  }, [handleJoinRoom]);

  // Host view - showing room code
  if (roomCode && peerId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-3xl border border-[#666a86]/30 bg-gradient-to-b from-[#131722]/90 to-[#0d1017]/95 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/50"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#92b6b1]/15 px-3.5 py-1 text-xs font-semibold text-[#b2c9ab] ring-1 ring-[#92b6b1]/30">
            <Sparkles className="h-3.5 w-3.5 text-[#e8ddb5]" />
            Room Ready for Pairing
          </div>

          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-[#788aa3]">
              Share 6-Digit Room Code
            </p>
            <div className="mt-3 inline-flex items-center justify-center gap-4 rounded-2xl border border-[#92b6b1]/30 bg-gradient-to-r from-[#666a86]/20 via-[#92b6b1]/15 to-[#b2c9ab]/15 px-8 py-4 shadow-inner shadow-[#92b6b1]/10">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-widest text-[#e8ddb5] drop-shadow-[0_0_24px_rgba(232,221,181,0.35)]">
                {roomCode}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-2 rounded-xl border border-[#666a86]/40 bg-[#131722]/80 px-4 py-2.5 text-sm font-medium text-[#f4efe1] hover:bg-[#666a86]/20 hover:border-[#92b6b1]/40 transition-all duration-150"
            >
              {copiedCode ? <Check className="h-4 w-4 text-[#b2c9ab]" /> : <Copy className="h-4 w-4 text-[#92b6b1]" />}
              {copiedCode ? "Copied!" : "Copy Code"}
            </button>

            <button
              onClick={copyInviteLink}
              className="inline-flex items-center gap-2 rounded-xl border border-[#666a86]/40 bg-[#131722]/80 px-4 py-2.5 text-sm font-medium text-[#f4efe1] hover:bg-[#666a86]/20 hover:border-[#92b6b1]/40 transition-all duration-150"
            >
              {copiedLink ? <Check className="h-4 w-4 text-[#b2c9ab]" /> : <Link2 className="h-4 w-4 text-[#92b6b1]" />}
              {copiedLink ? "Link Copied!" : "Copy Link"}
            </button>

            <button
              onClick={shareViaWebShare}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#788aa3] via-[#92b6b1] to-[#b2c9ab] px-5 py-2.5 text-sm font-semibold text-[#0d1017] hover:brightness-110 shadow-lg shadow-[#92b6b1]/20 transition-all duration-150"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                otherPeerId ? "animate-ping bg-[#b2c9ab]" : "animate-pulse bg-[#e8ddb5]"
              )} />
              <span className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                otherPeerId ? "bg-[#b2c9ab]" : "bg-[#e8ddb5]"
              )} />
            </span>
            <span className="text-[#f4efe1]/90">
              {otherPeerId ? (
                <span className="font-medium text-[#b2c9ab]">Peer connected! Ready to transfer files</span>
              ) : (
                <span className="text-[#788aa3]">Waiting for other device to join...</span>
              )}
            </span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="rounded-xl px-4 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </motion.div>
    );
  }

  // Join dialog view
  if (showJoinDialog) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden rounded-3xl border border-[#666a86]/30 bg-gradient-to-b from-[#131722]/95 to-[#0d1017]/95 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/50 max-w-md mx-auto"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight text-[#e8ddb5]">Join a Room</h3>
            <p className="mt-2 text-sm text-[#788aa3]">
              Enter the 6-digit room code from the sending device
            </p>
          </div>

          <div className="w-full space-y-3">
            <input
              ref={joinInputRef}
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleKeyDown}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-2xl border border-[#666a86]/40 bg-black/40 px-4 py-3.5 text-center text-3xl font-mono font-bold tracking-widest text-[#e8ddb5] placeholder:text-[#666a86] focus:border-[#92b6b1] focus:outline-none focus:ring-4 focus:ring-[#92b6b1]/15 transition-all"
            />

            {showNameInput && (
              <input
                ref={nameInputRef}
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-xl border border-[#666a86]/40 bg-black/30 px-4 py-2.5 text-sm text-[#f4efe1] placeholder:text-[#788aa3] focus:border-[#92b6b1] focus:outline-none focus:ring-2 focus:ring-[#92b6b1]/20"
              />
            )}
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={() => {
                setShowJoinDialog(false);
                setJoinCode("");
              }}
              className="flex-1 rounded-xl border border-[#666a86]/40 bg-white/[0.03] px-4 py-3 text-sm font-medium text-[#788aa3] hover:bg-white/[0.08] hover:text-[#f4efe1] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinRoom}
              disabled={!/^\d{6}$/.test(joinCode) || isConnecting}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200",
                /^\d{6}$/.test(joinCode) && !isConnecting
                  ? "bg-gradient-to-r from-[#788aa3] via-[#92b6b1] to-[#b2c9ab] text-[#0d1017] hover:brightness-110 shadow-lg shadow-[#92b6b1]/20"
                  : "bg-white/[0.04] text-[#666a86] cursor-not-allowed border border-[#666a86]/20"
              )}
            >
              {isConnecting ? "Connecting..." : "Connect"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {!showNameInput && (
            <button
              onClick={() => setShowNameInput(true)}
              className="text-xs text-[#788aa3] hover:text-[#b2c9ab] transition-colors"
            >
              + Add display name
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Default Landing / Create View
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-8 text-center"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-[#92b6b1]/30 bg-[#92b6b1]/10 px-4 py-1.5 text-xs font-semibold text-[#b2c9ab] backdrop-blur-md">
        <ShieldCheck className="h-4 w-4 text-[#92b6b1]" />
        Zero Server Storage • Direct P2P Encryption
      </div>

      <div className="max-w-xl space-y-3">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Send Files Directly,{" "}
          <span className="bg-gradient-to-r from-[#e8ddb5] via-[#b2c9ab] to-[#92b6b1] bg-clip-text text-transparent">
            Browser to Browser
          </span>
        </h2>
        <p className="text-base sm:text-lg text-[#788aa3] font-normal leading-relaxed">
          Transfer any size file directly between phones, laptops, and tablets with zero uploads, zero storage limits, and full WebRTC encryption.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={handleCreateRoom}
          disabled={isConnecting}
          className="group relative flex-1 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#788aa3] via-[#92b6b1] to-[#b2c9ab] p-[1.5px] shadow-xl shadow-[#92b6b1]/20 hover:shadow-[#92b6b1]/30 transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex h-full w-full items-center justify-center gap-2.5 rounded-[14.5px] bg-[#111520] px-6 py-4 text-base font-semibold text-[#f4efe1] group-hover:bg-[#111520]/80 transition-colors">
            <Sparkles className="h-5 w-5 text-[#b2c9ab] group-hover:rotate-12 transition-transform duration-200" />
            <span>{isConnecting ? "Creating..." : "Create Room"}</span>
          </div>
        </button>

        <button
          onClick={() => setShowJoinDialog(true)}
          className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl border border-[#666a86]/40 bg-[#131722]/80 px-6 py-4 text-base font-semibold text-[#f4efe1] hover:bg-[#666a86]/20 hover:border-[#92b6b1]/40 transition-all duration-200 active:scale-[0.98]"
        >
          <Link2 className="h-5 w-5 text-[#788aa3]" />
          <span>Join Room</span>
        </button>
      </div>
    </motion.div>
  );
}