"use client";

import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionStatusProps {
  state: string;
  onReconnect?: () => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  disconnected: { label: "Disconnected", color: "text-[#788aa3]", bg: "bg-[#666a86]/15 border-[#666a86]/30", icon: WifiOff },
  connectable: { label: "Waiting for Peer...", color: "text-[#e8ddb5]", bg: "bg-[#e8ddb5]/10 border-[#e8ddb5]/25", icon: Wifi },
  connecting: { label: "Connecting to Peer...", color: "text-[#92b6b1]", bg: "bg-[#92b6b1]/10 border-[#92b6b1]/25", icon: RefreshCw },
  connected: { label: "Connected", color: "text-[#b2c9ab]", bg: "bg-[#b2c9ab]/15 border-[#b2c9ab]/30", icon: Wifi },
  reconnecting: { label: "Reconnecting...", color: "text-[#e8ddb5]", bg: "bg-[#e8ddb5]/10 border-[#e8ddb5]/25", icon: RefreshCw },
  failed: { label: "Connection Failed", color: "text-rose-300", bg: "bg-rose-500/10 border-rose-500/25", icon: AlertCircle },
};

export function ConnectionStatus({ state, onReconnect, className }: ConnectionStatusProps) {
  const config = statusConfig[state] ?? statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {state !== "connected" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "mx-auto flex w-fit items-center gap-2.5 rounded-full border border-white/[0.08] px-4 py-2 text-xs font-medium backdrop-blur-xl shadow-lg shadow-black/30",
            config.bg,
            className
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
          <span className={config.color}>{config.label}</span>
          {onReconnect && (
            <>
              <div className="w-px h-3 bg-white/10" />
              <button
                onClick={onReconnect}
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}