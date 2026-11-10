"use client";

import { useCallback, useState } from "react";
import { Upload, FileUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  acceptedTypes?: string[];
}

export function FileDropzone({ onFilesSelected, disabled, acceptedTypes }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInput = useCallback((files: FileList) => {
    const arrayFiles = Array.from(files);
    onFilesSelected(arrayFiles);
  }, [onFilesSelected]);

  const handleBrowseClick = useCallback(() => {
    if (disabled) return;
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
  }, [acceptedTypes, disabled, handleFileInput]);

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-200",
          "border-[#666a86]/35 bg-gradient-to-b from-[#131722]/80 via-[#131722]/40 to-[#0d1017]/80 backdrop-blur-xl",
          "hover:border-[#92b6b1]/60 hover:bg-[#92b6b1]/[0.05]",
          isDragOver && "border-[#b2c9ab] bg-[#92b6b1]/15 shadow-[0_0_40px_rgba(178,201,171,0.2)] ring-2 ring-[#b2c9ab]/30",
          disabled && "opacity-50 cursor-not-allowed hover:border-[#666a86]/35 hover:bg-transparent"
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
          className="absolute inset-0 cursor-pointer opacity-0 z-10 disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#666a86]/40 via-[#788aa3]/30 to-[#92b6b1]/40 ring-1 ring-[#92b6b1]/30 shadow-lg shadow-[#92b6b1]/15">
            <FileUp className={cn(
              "h-8 w-8 text-[#b2c9ab] transition-transform duration-200",
              isDragOver && "-translate-y-1 scale-110"
            )} />
          </div>

          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-xl font-bold tracking-tight text-[#f4efe1]">
              Drop files here to stream
            </h3>
            <p className="text-sm text-[#788aa3]">
              or{" "}
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={disabled}
                className={cn(
                  "font-semibold underline underline-offset-4 transition-colors",
                  disabled ? "text-[#666a86] cursor-not-allowed" : "text-[#92b6b1] hover:text-[#b2c9ab]"
                )}
              >
                browse from your device
              </button>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#666a86]/30 bg-[#131722]/80 px-3.5 py-1 text-xs text-[#788aa3]">
            <span>Any file type</span>
            <span>•</span>
            <span>Direct P2P memory stream</span>
            <span>•</span>
            <span>No size cap</span>
          </div>
        </div>
      </div>
    </div>
  );
}