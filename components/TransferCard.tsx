"use client";

import { File as FileIcon, Download, AlertCircle, CheckCircle2, Pause, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface TransferCardProps {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    transferredBytes: number;
    totalBytes: number;
    speed: number;
  };
  status: "queued" | "preparing" | "transferring" | "completed" | "failed" | "cancelled" | "aborted" | "paused";
  onDownload?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

const MAX_VISIBLE_LENGTH = 30;

export function TransferCard({ file, status, onDownload, onPause, onResume }: TransferCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B/s`;
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed": return "border-teal-500/30 bg-teal-500/5";
      case "failed": return "border-red-500/30 bg-red-500/5";
      case "transferring":
      case "paused": return "border-teal-500/30 bg-teal-500/5";
      default: return "border-yellow-500/30 bg-yellow-500/5";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-teal-500" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "transferring": return <FileIcon className="h-4 w-4 text-teal-400" />;
      case "paused": return <Pause className="h-4 w-4 text-yellow-500" />;
      case "queued":
      case "preparing":
      case "cancelled":
      case "aborted": return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const displayFileName = file.name.length > MAX_VISIBLE_LENGTH
    ? file.name.slice(0, Math.floor(MAX_VISIBLE_LENGTH / 2)) + "..." + file.name.slice(-Math.floor(MAX_VISIBLE_LENGTH / 2) - 3)
    : file.name;

  return (
    <motion.div
      layout
      className={cn(
        "w-full rounded-xl border bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-4 backdrop-blur transition-all duration-200",
        getStatusColor()
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
              <h4
                className={cn(
                  "font-medium cursor-pointer transition-colors",
                  status === "completed" ? "text-teal-400 hover:text-teal-300" : "text-foreground hover:text-teal-400"
                )}
                title={file.name}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {displayFileName}
              </h4>
              <p className="text-xs text-muted-foreground/60">
                {formatSize(file.size)} • {"sent"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon()}
              {status === "completed" && onDownload && (
                <button
                  onClick={onDownload}
                  className="rounded-full p-1.5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all duration-200"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
              {status === "transferring" && onPause && (
                <button
                  onClick={onPause}
                  className="rounded-full p-1.5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all duration-200"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}
              {status === "paused" && onResume && (
                <button
                  onClick={onResume}
                  className="rounded-full p-1.5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all duration-200"
                  title="Resume"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {status !== "completed" && status !== "failed" && (
            <>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                  <span>{Math.round(file.progress)}%</span>
                  <span>{formatSpeed(file.transferredBytes)} / {formatSize(file.totalBytes)}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-500 to-violet-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </>
          )}

          {isExpanded && status === "transferring" && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: "0.5rem" }}
              className="mt-2 text-xs text-muted-foreground/60"
            >
              <div className="flex gap-4">
                <span>Transferred: {formatSize(file.transferredBytes)}</span>
                <span>Remaining: {formatSize(file.totalBytes - file.transferredBytes)}</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}