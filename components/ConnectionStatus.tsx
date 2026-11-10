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
  disconnected: { label: "Disconnected", color: "text-foreground/60", bg: "bg-foreground/5", icon: WifiOff },
  connectable: { label: "Ready", color: "text-teal-500", bg: "bg-teal-500/10", icon: Wifi },
  connecting: { label: "Connecting...", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Wifi },
  connected: { label: "Connected", color: "text-teal-400", bg: "bg-teal-500/10", icon: Wifi },
  reconnecting: { label: "Reconnecting...", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: RefreshCw },
  failed: { label: "Connection Failed", color: "text-red-400", bg: "bg-red-500/10", icon: AlertCircle },
};

export function ConnectionStatus({ state, onReconnect, className }: ConnectionStatusProps) {
  const config = statusConfig[state] ?? statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {state !== "connected" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950/50 px-4 py-2.5 text-sm backdrop-blur-xl shadow-lg",
            config.bg,
            className
          )}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className={config.color}>{config.label}</span>
          {onReconnect && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={onReconnect}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200"
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