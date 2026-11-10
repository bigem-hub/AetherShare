"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
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
          "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300",
          "hover:border-teal-500/50 hover:bg-teal-500/5",
          isDragOver && "border-teal-400 bg-teal-500/10",
          disabled && "opacity-60 cursor-not-allowed"
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

        <div className="flex flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-violet-500/20">
            <Upload className="h-7 w-7 text-teal-400" />
          </div>

          <div>
            <h3 className="text-xl font-semibold">
              Drop files to transfer
            </h3>
            <p className="mt-2 text-sm text-muted-foreground/70">
              Or{" "}
              <button
                onClick={handleBrowseClick}
                disabled={disabled}
                className={cn(
                  "font-medium underline",
                  disabled ? "cursor-not-allowed text-muted-foreground/50" : "text-teal-400 hover:text-teal-300"
                )}
              >
                Browse files
              </button>
            </p>
          </div>

          <div className="text-xs text-muted-foreground/60">
            <p>Supported: All file types</p>
            <p>Drag and drop multiple files</p>
          </div>
        </div>
      </div>
    </div>
  );
}