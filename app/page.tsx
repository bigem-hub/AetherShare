"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { RoomManager } from "@/components/RoomManager";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { FileDropzone } from "@/components/FileDropzone";
import { TransferQueue } from "@/components/TransferQueue";
import { FileList } from "@/components/FileList";
import { usePeerTransfer } from "@/hooks/usePeerTransfer";
import { AlertCircle } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

export default function HomePage() {
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "error" | "success" } | null>(null);

  const {
    connectionState,
    roomCode,
    peerId,
    otherPeerId,
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
  } = usePeerTransfer();

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Automatically join room if ?room=123456 is in the URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get("room");
      if (urlRoom && /^\d{6}$/.test(urlRoom) && !roomCode) {
        joinRoom(urlRoom);
      }
    }
  }, [joinRoom, roomCode]);

  const handleDrop = async (files: File[]) => {
    if (connectionState !== "connected" || !otherPeerId) {
      setToast({ message: "Connect to a peer first", type: "error" });
      return;
    }

    for (const file of files) {
      try {
        await sendFile(file);
      } catch (e: any) {
        console.error("Transfer failed:", e);
        setToast({ message: `Failed to send ${file.name}: ${e.message || "Unknown error"}`, type: "error" });
      }
    }
  };

  const isConnected = connectionState === "connected";

  return (
    <>
      <Header connectionState={connectionState} peerId={peerId} otherPeerId={otherPeerId} onDisconnect={leaveRoom} />

      <main className="mt-16 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
            className="mx-auto max-w-4xl"
          >
            {roomCode && otherPeerId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <div className="rounded-2xl border border-[#666a86]/35 bg-[#131722]/85 p-4 backdrop-blur-xl shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#788aa3] uppercase tracking-wider">Connected Room:</span>
                    <span className="font-mono text-[#e8ddb5] font-bold tracking-widest text-lg">{roomCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQR(true)}
                      className="rounded-xl border border-[#666a86]/40 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[#f4efe1] hover:bg-[#666a86]/20 transition-colors"
                    >
                      Show QR
                    </button>
                    <button
                      onClick={leaveRoom}
                      className="rounded-xl bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {!isConnected && connectionState !== "failed" && connectionState !== "disconnected" && (
              <ConnectionStatus state={connectionState} />
            )}

            {connectionState === "failed" && (
              <div className="mb-6">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                  <div className="text-sm text-red-400 font-medium mb-2">Connection Failed</div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => createRoom()}
                      className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30 transition-all duration-200"
                    >
                      Retry
                    </button>
                    <button
                      onClick={leaveRoom}
                      className="rounded-lg bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            )}

            <RoomManager
              roomCode={roomCode}
              peerId={peerId}
              otherPeerId={otherPeerId}
              isConnecting={connectionState === "connecting"}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onLeaveRoom={leaveRoom}
            />

            {isConnected && otherPeerId && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: "1.5rem" }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="mt-8"
              >
                <FileDropzone onFilesSelected={handleDrop} disabled={!isConnected || !otherPeerId} />
              </motion.div>
            )}

            <AnimatePresence>
              {(transfers.length > 0 || receivedFiles.length > 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8"
                >
                  <TransferQueue
                    transfers={transfers}
                    onCancel={cancelTransfer}
                    onRetry={retryTransfer}
                    onRemove={removeTransfer}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {receivedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="mt-8"
                >
                  <FileList files={receivedFiles} onDownload={downloadFile} onRemove={removeReceivedFile} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isConnected && otherPeerId && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="mt-8"
                >
                  <div className="rounded-3xl border border-[#666a86]/35 bg-[#131722]/70 p-5 backdrop-blur-xl shadow-lg">
                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-[#666a86]/30">
                      <div>
                        <div className="text-xs font-medium text-[#788aa3]">Active Transfers</div>
                        <div className="text-2xl font-bold font-mono text-[#b2c9ab] mt-1">
                          {transfers.filter((t) => t.status === "transferring").length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#788aa3]">Files Received</div>
                        <div className="text-2xl font-bold font-mono text-[#e8ddb5] mt-1">{receivedFiles.length}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#788aa3]">Transferred</div>
                        <div className="text-2xl font-bold font-mono text-[#92b6b1] mt-1">
                          {formatFileSize(transfers.reduce((sum: number, t) => sum + t.transferredBytes, 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {showQR && roomCode && <QRCodeDisplay roomCode={roomCode} onClose={() => setShowQR(false)} />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed top-20 right-4 z-50 max-w-sm w-full px-4 sm:px-0"
          >
            <div
              className={cn(
                "rounded-2xl border p-4 backdrop-blur-2xl shadow-2xl shadow-black/50 ring-1",
                toast.type === "error"
                  ? "border-rose-500/30 bg-[#160d14]/95 ring-rose-500/20 text-rose-200"
                  : "border-[#92b6b1]/35 bg-[#131722]/95 ring-[#92b6b1]/20 text-[#b2c9ab]"
              )}
            >
              <div className="flex items-center gap-3">
                {toast.type === "error" ? (
                  <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#b2c9ab] flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div
                    className={cn(
                      "font-semibold text-sm",
                      toast.type === "error" ? "text-rose-300" : "text-[#e8ddb5]"
                    )}
                  >
                    {toast.type === "error" ? "Notice" : "Success"}
                  </div>
                  <div className="text-xs text-[#f4efe1]/80 mt-0.5 break-words">{toast.message}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}