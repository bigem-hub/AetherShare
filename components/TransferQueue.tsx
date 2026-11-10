"use client";

import { useState, useEffect } from "react";
import { File as FileIcon, X, CheckCircle, AlertCircle, Clock, Users } from "lucide-react";
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
        return <CheckCircle className="h-4 w-4 text-teal-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-foreground/50" />;
      case "transferring":
        return <Clock className="h-4 w-4 text-teal-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return "border-teal-500/30 bg-teal-500/5";
      case "failed":
        return "border-red-500/30 bg-red-500/5";
      case "completed":
        return "border-teal-500/30 bg-teal-500/5";
      case "transferring":
        return "border-teal-500/30 bg-teal-500/5";
      default:
        return "border-yellow-500/30 bg-yellow-500/5";
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
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const activeTransfers = transfers.filter(t => t.status !== "completed" && t.status !== "failed");
  const completedTransfers = transfers.filter(t => t.status === "completed");

  if (transfers.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transfer Queue</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>2 peers</span>
          </div>
        </div>
      </div>

      {/* Active Transfers */}
      <AnimatePresence>
        {activeTransfers.map((transfer, index) => (
          <motion.div
            key={transfer.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "rounded-xl border p-4 transition-all duration-200",
              getStatusColor(transfer.status)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="rounded-lg bg-white/10 p-2">
                  <FileIcon className="h-5 w-5 text-teal-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{transfer.fileName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {(transfer.fileSize / 1024 / 1024).toFixed(2)} MB • {transfer.direction}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(transfer.status)}
                    {transfer.status === "failed" && onRetry && (
                      <button
                        onClick={() => onRetry(transfer.id)}
                        className="rounded-full p-1 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                        title="Retry transfer"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>
                    )}
                    {transfer.status === "cancelled" && onRemove && (
                      <button
                        onClick={() => onRemove(transfer.id)}
                        className="rounded-full p-1 text-foreground/40 hover:text-foreground hover:bg-white/10"
                        title="Remove transfer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onCancel(transfer.status === "failed" ? undefined as any : transfer.id)}
                      className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      title={transfer.status === "failed" ? "Retry" : "Cancel transfer"}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {transfer.status !== "completed" && transfer.status !== "failed" && (
                  <>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{Math.round(transfer.progress)}%</span>
                        <span>{formatSpeed(transfer.speed)} • ETA: {formatETA(transfer.transferredBytes, transfer.totalBytes, transfer.speed)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-teal-500 to-violet-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${transfer.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {transfer.error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "1.2em" }}
                    className="mt-2 text-xs text-red-400"
                  >
                    {transfer.error}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Recently Completed */}
      {completedTransfers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6"
        >
          <h4 className="text-sm font-medium text-muted-foreground/70 mb-3">
            Recent Transfers
          </h4>
          <AnimatePresence>
            {completedTransfers.slice(-3).reverse().map((transfer, index) => (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-teal-500" />
                <div className="flex-1">
                  <span className="font-medium">{transfer.fileName}</span>
                  <span className="text-xs text-muted-foreground/70">
                    {" "}• Completed
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}