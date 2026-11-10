"use client";

import { useState } from "react";
import { File as FileIcon, X, CheckCircle, AlertCircle, Clock, Users, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Transfer } from "@/lib/types";

interface TransferQueueProps {
  transfers: Transfer[];
  onCancel: (id: string) => void;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export function TransferQueue({ transfers, onCancel, onRetry, onRemove }: TransferQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusIcon = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-[#b2c9ab]" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-rose-400" />;
      case "cancelled":
        return <X className="h-4 w-4 text-[#788aa3]" />;
      case "transferring":
        return <FileIcon className="h-4 w-4 text-[#92b6b1]" />;
      case "queued":
      case "preparing":
        return <Clock className="h-4 w-4 text-[#e8ddb5]" />;
      default:
        return <Clock className="h-4 w-4 text-[#e8ddb5]" />;
    }
  };

  const getStatusColor = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return "border-[#b2c9ab]/30 bg-[#b2c9ab]/10";
      case "failed":
        return "border-rose-500/30 bg-rose-500/10";
      case "transferring":
        return "border-[#92b6b1]/30 bg-[#92b6b1]/10";
      default:
        return "border-[#e8ddb5]/30 bg-[#e8ddb5]/10";
    }
  };

  const formatSpeed = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B/s`;
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatETA = (transferred: number, total: number, speed: number) => {
    if (speed === 0 || transferred === 0) return "--:--";
    const remaining = total - transferred;
    const seconds = Math.floor(remaining / speed);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const activeTransfers = transfers.filter(t => t.status !== "completed" && t.status !== "failed");
  const completedTransfers = transfers.filter(t => t.status === "completed");

  if (transfers.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transfer Queue</h3>
      </div>

      {/* Active Transfers */}
      <AnimatePresence>
        {activeTransfers.map((transfer, index) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "rounded-2xl border p-4.5 transition-all duration-150 backdrop-blur-xl",
              transfer.status === "failed"
                ? "border-rose-500/30 bg-rose-500/[0.04]"
                : "border-[#666a86]/35 bg-[#131722]/85 shadow-lg shadow-black/30"
            )}
          >
            <div className="flex items-start gap-3.5">
              <div className="flex-shrink-0">
                <div className="rounded-xl bg-[#92b6b1]/15 p-2.5 ring-1 ring-[#92b6b1]/25">
                  <FileIcon className="h-5 w-5 text-[#b2c9ab]" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-[#f4efe1] truncate">{transfer.fileName}</h4>
                    <p className="text-xs text-[#788aa3]">
                      {(transfer.fileSize / 1024 / 1024).toFixed(2)} MB • {transfer.direction}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusIcon(transfer.status)}
                    {transfer.status === "failed" && onRetry && (
                      <button
                        onClick={() => onRetry(transfer.id)}
                        className="rounded-xl p-1.5 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
                        title="Retry transfer"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    {transfer.status === "cancelled" && onRemove && (
                      <button
                        onClick={() => onRemove(transfer.id)}
                        className="rounded-xl p-1.5 text-[#788aa3] hover:text-[#f4efe1] hover:bg-white/10 transition-colors"
                        title="Remove transfer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {transfer.status !== "completed" && transfer.status !== "failed" && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-[#788aa3]">
                      <span className="font-mono text-[#e8ddb5]">{Math.round(transfer.progress)}%</span>
                      <span className="font-mono text-[#788aa3]">
                        {formatSpeed(transfer.speed)} • ETA: {formatETA(transfer.transferredBytes, transfer.totalBytes, transfer.speed)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden p-[1px]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#788aa3] via-[#92b6b1] to-[#b2c9ab] shadow-[0_0_12px_rgba(178,201,171,0.35)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${transfer.progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {transfer.error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "1.2em" }}
                    className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {transfer.error}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}