"use client";

import { File as FileIcon, X, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReceivedFile } from "@/lib/types";

interface FileListProps {
  files: ReceivedFile[];
  onDownload: (file: ReceivedFile) => void;
  onRemove: (id: string) => void;
}

export function FileList({ files, onDownload, onRemove }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-gradient-to-b from-slate-900/30 to-slate-950/30 p-6 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center">
          <FileIcon className="h-6 w-6 text-teal-400" />
        </div>
        <h3 className="text-lg font-medium">No files received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Files transferred from connected peers will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Received Files</h3>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/50 p-3"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-teal-500/10 p-2">
              <FileIcon className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="rounded-md p-1.5 text-teal-400 hover:bg-teal-500/10 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => onRemove(file.id)}
              className="rounded-md p-1.5 text-foreground/40 hover:text-foreground hover:bg-white/10 transition-colors"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}