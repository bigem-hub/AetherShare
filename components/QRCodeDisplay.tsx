"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { X, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QRCodeDisplayProps {
  roomCode: string;
  onClose: () => void;
}

export function QRCodeDisplay({ roomCode, onClose }: QRCodeDisplayProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");

  const generateInviteUrl = useCallback(() => {
    // Generate a URL that includes the room code
    const url = `${window.location.origin}?room=${roomCode}`;
    return url;
  }, [roomCode]);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = generateInviteUrl();
        const dataURL = await QRCode.toDataURL(url, {
          width: 320,
          margin: 2,
          color: {
            dark: "#ffffff",
            light: "#05060a",
          },
        });
        setQrCodeDataURL(dataURL);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    };
    generateQR();
  }, [generateInviteUrl]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(roomCode);
  }, [roomCode]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(generateInviteUrl());
  }, [generateInviteUrl]);

  const shareLink = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AetherShare File Transfer",
          text: "Join this AetherShare room to transfer files directly",
          url: generateInviteUrl(),
        });
      } catch (e) {
        // User dismissed share dialog
      }
    }
  }, [generateInviteUrl]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-6 backdrop-blur-lg max-w-sm w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h3 className="text-lg font-semibold">Invite Peer</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Send this code or QR to the other device
            </p>
          </div>

          <div className="relative">
            {qrCodeDataURL && (
              <div className="rounded-lg border border-white/10 bg-white p-2">
                <img
                  src={qrCodeDataURL}
                  alt={`QR code for room ${roomCode}`}
                  className="mx-auto"
                />
              </div>
            )}
            <div className="mt-2">
              <div className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-teal-500/20 to-violet-500/20 px-4 py-2">
                <span className="font-mono text-lg font-bold text-teal-400 tracking-wider">
                  {roomCode}
                </span>
                <Copy className="h-4 w-4 text-teal-400" />
              </div>
            </div>
          </div>

          <div className="flex w-full gap-2">
            <button
              onClick={copyCode}
              className="flex-1 rounded-md bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
            >
              Copy Code
            </button>
            <button
              onClick={copyLink}
              className="flex-1 rounded-md bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 transition-colors"
            >
              Copy Link
            </button>
            <button
              onClick={shareLink}
              className="flex-1 rounded-md bg-gradient-to-r from-teal-500 to-violet-600 px-4 py-2 text-sm text-white hover:from-teal-600 hover:to-violet-700 transition-colors"
            >
              <Share2 className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}