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
      <div className="rounded-2xl border border-dashed border-white/10 bg-gradient-to-b from-slate-900/30 to-slate-950/30 p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center">
          <FileIcon className="h-6 w-6 text-teal-400" />
        </div>
        <h3 className="text-lg font-medium">No files received</h3>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Files transferred from connected peers will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Received Files</h3>
        <button
          onClick={() => files.forEach(f => onRemove(f.id))}
          className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
        >
          Clear All
        </button>
      </div>

      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-4 backdrop-blur transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-500/10 p-2">
                <FileIcon className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground/60">
                  {file.type} • {formatSize(file.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onDownload(file)}
                className="rounded-lg bg-teal-500/10 p-2 text-teal-400 hover:bg-teal-500/20 transition-all duration-200"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRemove(file.id)}
                className="rounded-lg p-2 text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all duration-200"
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