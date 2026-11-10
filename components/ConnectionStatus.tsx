"use client";

import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ConnectionStatusProps {
  state: string;
  onReconnect?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  disconnected: { label: "Disconnected", color: "text-foreground/50", icon: WifiOff },
  connectable: { label: "Ready", color: "text-teal-500", icon: Wifi },
  connecting: { label: "Connecting...", color: "text-yellow-500", icon: Wifi },
  connected: { label: "Connected", color: "text-teal-500", icon: Wifi },
  reconnecting: { label: "Reconnecting...", color: "text-yellow-500", icon: RefreshCw },
  failed: { label: "Connection Failed", color: "text-red-500", icon: WifiOff },
};

export function ConnectionStatus({ state, onReconnect }: ConnectionStatusProps) {
  const config = statusConfig[state] ?? statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {state !== "connected" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur"
        >
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className={config.color}>{config.label}</span>
          {onReconnect && (
            <button
              onClick={onReconnect}
              className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              Retry
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}