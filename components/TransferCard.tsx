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
      case "completed": return "border-[#b2c9ab]/30 bg-[#b2c9ab]/5";
      case "failed": return "border-rose-500/30 bg-rose-500/5";
      case "transferring":
      case "paused": return "border-[#92b6b1]/30 bg-[#92b6b1]/5";
      default: return "border-[#e8ddb5]/30 bg-[#e8ddb5]/5";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-[#b2c9ab]" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-rose-400" />;
      case "transferring": return <FileIcon className="h-4 w-4 text-[#92b6b1]" />;
      case "paused": return <Pause className="h-4 w-4 text-[#e8ddb5]" />;
      case "queued":
      case "preparing":
      case "cancelled":
      case "aborted": return <Clock className="h-4 w-4 text-[#e8ddb5]" />;
      default: return <Clock className="h-4 w-4 text-[#e8ddb5]" />;
    }
  };

  const displayFileName = file.name.length > MAX_VISIBLE_LENGTH
    ? file.name.slice(0, Math.floor(MAX_VISIBLE_LENGTH / 2)) + "..." + file.name.slice(-Math.floor(MAX_VISIBLE_LENGTH / 2) - 3)
    : file.name;

  return (
    <motion.div
      layout
      className={cn(
        "w-full rounded-2xl border p-4.5 backdrop-blur-xl transition-all duration-150",
        status === "completed"
          ? "border-[#b2c9ab]/30 bg-[#b2c9ab]/[0.05]"
          : status === "failed"
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
              <h4
                className={cn(
                  "font-semibold text-sm truncate cursor-pointer transition-colors",
                  status === "completed" ? "text-[#b2c9ab] hover:text-[#e8ddb5]" : "text-[#f4efe1] hover:text-[#92b6b1]"
                )}
                title={file.name}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {displayFileName}
              </h4>
              <p className="text-xs text-[#788aa3]">
                {formatSize(file.size)} • sent
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {getStatusIcon()}
              {status === "completed" && onDownload && (
                <button
                  onClick={onDownload}
                  className="rounded-xl p-1.5 text-[#b2c9ab] hover:text-[#e8ddb5] hover:bg-[#b2c9ab]/15 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
              {status === "transferring" && onPause && (
                <button
                  onClick={onPause}
                  className="rounded-xl p-1.5 text-[#788aa3] hover:text-[#f4efe1] hover:bg-white/10 transition-colors"
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}
              {status === "paused" && onResume && (
                <button
                  onClick={onResume}
                  className="rounded-xl p-1.5 text-[#92b6b1] hover:text-[#b2c9ab] hover:bg-[#92b6b1]/15 transition-colors"
                  title="Resume"
                >
                  <Play className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {status !== "completed" && status !== "failed" && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-[#788aa3]">
                <span className="font-mono text-[#e8ddb5]">{Math.round(file.progress)}%</span>
                <span className="font-mono text-[#788aa3]">{formatSpeed(file.transferredBytes)} / {formatSize(file.totalBytes)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden p-[1px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#788aa3] via-[#92b6b1] to-[#b2c9ab] shadow-[0_0_12px_rgba(178,201,171,0.35)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${file.progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
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