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
import { formatFileSize } from "@/lib/utils";

export default function HomePage() {
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState<{ message: string } | null>(null);

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
      setToast({ message: error });
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDrop = async (files: File[]) => {
    if (connectionState !== "connected") {
      setToast({ message: "Connect to a peer first" });
      return;
    }

    for (const file of files) {
      try {
        await sendFile(file);
      } catch (e: any) {
        console.error("Transfer failed:", e);
        setToast({ message: "Failed to send " + file.name + ": " + (e.message || "Unknown error") });
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
            {isConnected && roomCode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <div className="rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-4 backdrop-blur flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Room:{" "}
                    <span className="font-mono text-teal-400 tracking-wider">{roomCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQR(true)}
                      className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                    >
                      Show QR
                    </button>
                    <button
                      onClick={leaveRoom}
                      className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {!isConnected && (
              <ConnectionStatus state={connectionState} onReconnect={leaveRoom} />
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

            {isConnected && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: "1.5rem" }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="mt-8"
              >
                <FileDropzone onFilesSelected={handleDrop} disabled={!isConnected} />
              </motion.div>
            )}

            {(transfers.length > 0 || receivedFiles.length > 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
                <TransferQueue transfers={transfers} onCancel={cancelTransfer} onRetry={retryTransfer} onRemove={removeTransfer} />
              </motion.div>
            )}

            {receivedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Received Files</h3>
                  <button
                    onClick={clearReceivedFiles}
                    className="rounded-md bg-white/5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <FileList files={receivedFiles} onDownload={downloadFile} onRemove={removeReceivedFile} />
              </motion.div>
            )}

            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-4 backdrop-blur"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Active Transfers</div>
                    <div className="text-2xl font-bold text-teal-400">
                      {transfers.filter((t) => t.status === "transferring").length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Files Received</div>
                    <div className="text-2xl font-bold text-teal-400">{receivedFiles.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total:{" "}
                      {formatFileSize(transfers.reduce((sum: number, t) => sum + t.transferredBytes, 0))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {showQR && roomCode && <QRCodeDisplay roomCode={roomCode} onClose={() => setShowQR(false)} />}

      {toast && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-24 right-4 z-50 max-w-sm w-full"
          >
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-300">Error</div>
                  <div className="text-sm text-red-200">{toast.message}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}