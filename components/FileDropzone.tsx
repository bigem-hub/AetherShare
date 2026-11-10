"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  acceptedTypes?: string[];
}

export function FileDropzone({ onFilesSelected, disabled, acceptedTypes }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback((files: FileList) => {
    const arrayFiles = Array.from(files);
    onFilesSelected(arrayFiles);
  }, [onFilesSelected]);

  const handleBrowseClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = acceptedTypes?.join(",") ?? "*/*";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileInput(files);
      }
    };
    input.click();
  }, [acceptedTypes, handleFileInput]);

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
          isDragOver && "border-teal-500/50 bg-teal-500/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragOver && "border-white/10 hover:border-white/20 hover:bg-white/5"
        )}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes?.join(",") ?? "*/*"}
          onChange={e => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileInput(files);
            }
          }}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-centered rounded-full bg-gradient-to-br from-teal-500/20 to-violet-500/20">
            <Upload className="h-8 w-8 text-teal-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold">
              Drop files to transfer
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Or{" "}
              <button
                onClick={handleBrowseClick}
                className={cn(
                  "underline font-medium",
                  disabled ? "cursor-not-allowed" : "hover:text-teal-400"
                )}
                disabled={disabled}
              >
                Browse files
              </button>
            </p>
          </div>

          <div className="text-xs text-muted-foreground/70">
            <p>Supported: All file types</p>
            <p>Recommended: Files under 10GB</p>
          </div>
        </div>
      </div>

      {/* Preview overlay for clicked file */}
      {previewFile && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
          >
            <FileText className="h-4 w-4 text-teal-400" />
            <div className="flex-1">
              <div className="font-medium text-foreground">{previewFile.name}</div>
              <div className="text-xs text-muted-foreground">
                {(previewFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button
              onClick={() => setPreviewFile(null)}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}