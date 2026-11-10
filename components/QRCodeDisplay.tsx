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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
          width: 320,
          margin: 1,
          color: {
            dark: "#07090e",
            light: "#ffffff",
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
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [roomCode]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(generateInviteUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [generateInviteUrl]);

  const shareLink = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AetherShare File Transfer",
          text: `Join room ${roomCode} on AetherShare to send files directly`,
          url: generateInviteUrl(),
        });
      } catch (e) {
        // User dismissed share dialog
      }
    } else {
      copyLink();
    }
  }, [generateInviteUrl, copyLink, roomCode]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
          className="relative flex flex-col items-center gap-6 rounded-3xl border border-[#666a86]/35 bg-[#131722]/95 p-8 backdrop-blur-2xl shadow-2xl shadow-black/80 max-w-sm w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-xl p-2 text-[#788aa3] hover:text-[#f4efe1] hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-[#e8ddb5]">Scan to Connect</h3>
            <p className="text-xs text-[#788aa3]">
              Point your phone camera to pair instantly
            </p>
          </div>

          <div className="relative">
            {qrCodeDataURL ? (
              <div className="rounded-2xl bg-white p-3.5 shadow-2xl shadow-[#92b6b1]/20 ring-4 ring-[#92b6b1]/30">
                <img
                  src={qrCodeDataURL}
                  alt={`QR code for room ${roomCode}`}
                  className="w-48 h-48 rounded-lg mx-auto"
                />
              </div>
            ) : (
              <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-[#666a86]/30 bg-black/40">
                {loading && <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#92b6b1]/30 border-t-[#b2c9ab]" />}
              </div>
            )}

            <div className="mt-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#788aa3] font-semibold block mb-1">
                Room Code
              </span>
              <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#92b6b1]/30 bg-[#92b6b1]/15 px-5 py-2">
                <span className="font-mono text-2xl font-extrabold text-[#e8ddb5] tracking-widest">
                  {roomCode}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-2.5">
            <button
              onClick={copyCode}
              className="flex-1 rounded-xl border border-[#666a86]/40 bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-[#f4efe1] hover:bg-[#666a86]/20 transition-colors"
            >
              {copiedCode ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={copyLink}
              className="flex-1 rounded-xl border border-[#666a86]/40 bg-white/[0.03] px-3.5 py-2.5 text-xs font-semibold text-[#f4efe1] hover:bg-[#666a86]/20 transition-colors"
            >
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={shareLink}
              className="rounded-xl bg-gradient-to-r from-[#788aa3] via-[#92b6b1] to-[#b2c9ab] px-4 py-2.5 text-xs font-semibold text-[#0d1017] hover:brightness-110 shadow-md shadow-[#92b6b1]/20 transition-all"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}