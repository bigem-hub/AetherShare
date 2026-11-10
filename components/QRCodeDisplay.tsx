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
  const [loading, setLoading] = useState(true);

  const generateInviteUrl = useCallback(() => {
    const url = `${window.location.origin}?room=${roomCode}`;
    return url;
  }, [roomCode]);

  useEffect(() => {
    const generateQR = async () => {
      setLoading(true);
      try {
        const url = generateInviteUrl();
        const dataURL = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: "#ffffff",
            light: "#05060a",
          },
        });
        setQrCodeDataURL(dataURL);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      } finally {
        setLoading(false);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-8 backdrop-blur-xl shadow-2xl max-w-sm w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold">Invite Peer</h3>
            <p className="mt-2 text-sm text-muted-foreground/70">
              Send this code or QR to the other device
            </p>
          </div>

          <div className="relative">
            {qrCodeDataURL ? (
              <div className="rounded-xl border border-white/10 bg-white p-3">
                <img
                  src={qrCodeDataURL}
                  alt={`QR code for room ${roomCode}`}
                  className="mx-auto"
                />
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-white/10 bg-slate-950/50">
                {loading && <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-500/30 border-t-teal-500" />}
              </div>
            )}
            <div className="mt-4">
              <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-violet-500/20 px-4 py-2">
                <span className="font-mono text-xl font-bold text-teal-400 tracking-wider">
                  {roomCode}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <button
              onClick={copyCode}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
            >
              Copy Code
            </button>
            <button
              onClick={copyLink}
              className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/10 transition-all duration-200"
            >
              Copy Link
            </button>
            <button
              onClick={shareLink}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-violet-600 px-4 py-2.5 text-sm text-white hover:from-teal-600 hover:to-violet-700 transition-all duration-200 shadow-md"
            >
              <Share2 className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}