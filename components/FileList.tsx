"use client";

import { File as FileIcon, X, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ReceivedFile } from "@/lib/types";

interface FileListProps {
  files: ReceivedFile[];
  onDownload: (file: ReceivedFile) => void;
  onRemove: (id: string) => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export function FileList({ files, onDownload, onRemove }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#666a86]/35 bg-[#131722]/40 p-8 text-center backdrop-blur-md">
        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-[#92b6b1]/15 ring-1 ring-[#92b6b1]/25 flex items-center justify-center">
          <FileIcon className="h-6 w-6 text-[#b2c9ab]" />
        </div>
        <h3 className="text-base font-semibold text-[#f4efe1]">No files received yet</h3>
        <p className="mt-1 text-xs text-[#788aa3]">
          Files transferred from the connected peer will appear here for download
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#f4efe1] tracking-tight">Received Files ({files.length})</h3>
        <button
          onClick={() => files.forEach(f => onRemove(f.id))}
          className="rounded-xl border border-[#666a86]/40 bg-[#131722]/80 px-3 py-1.5 text-xs font-semibold text-[#788aa3] hover:text-[#f4efe1] hover:bg-[#666a86]/20 transition-colors"
        >
          Clear All
        </button>
      </div>

      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="flex items-center justify-between rounded-2xl border border-[#666a86]/35 bg-[#131722]/85 p-4 backdrop-blur-xl transition-all duration-150 hover:border-[#92b6b1]/40 shadow-lg shadow-black/20"
          >
            <div className="flex items-center gap-3.5 min-w-0 pr-4">
              <div className="rounded-xl bg-[#92b6b1]/15 p-2.5 ring-1 ring-[#92b6b1]/25 flex-shrink-0">
                <FileIcon className="h-5 w-5 text-[#b2c9ab]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#f4efe1] truncate">{file.name}</p>
                <p className="text-xs text-[#788aa3]">
                  {formatSize(file.size)} • {file.type || "file"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#92b6b1]/20 px-3 py-2 text-xs font-semibold text-[#b2c9ab] hover:bg-[#92b6b1]/30 ring-1 ring-[#92b6b1]/30 transition-colors"
                title="Download file"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={() => onRemove(file.id)}
                className="rounded-xl p-2 text-[#788aa3] hover:text-[#f4efe1] hover:bg-white/[0.08] transition-colors"
                title="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}