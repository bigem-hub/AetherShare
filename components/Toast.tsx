"use client";

import { X, Check, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

let toastId = 0;
type Listener = (toast: Toast) => void;
let listeners: Listener[] = [];

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts(prev => [...prev, toast]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastId}-${Date.now()}`;
    const newToast = { ...toast, id };
    listeners.forEach(l => l(newToast));

    if ((toast.duration ?? 5000) > 0) {
      setTimeout(() => removeToast(id), toast.duration);
    }
  };

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

// Export toast function globally
if (typeof window !== "undefined") {
  (window as any).addToast = (toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastId}-${Date.now()}`;
    listeners.forEach(l => l({ ...toast, id }));
  };
}

const ToastContainer = ({ toasts, removeToast }: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="rounded-2xl border border-[#666a86]/35 bg-[#131722]/95 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-white/10 text-[#f4efe1]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {toast.type === "success" && <Check className="h-5 w-5 text-[#b2c9ab]" />}
                {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400" />}
                {toast.type === "info" && <Info className="h-5 w-5 text-[#92b6b1]" />}
                {toast.type === "warning" && <AlertCircle className="h-5 w-5 text-[#e8ddb5]" />}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && <div className="font-medium text-[#e8ddb5]">{toast.title}</div>}
                <div className="text-sm text-[#788aa3]">{toast.message}</div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: Omit<Toast, "id">) => {
    const id = `toast-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    setToasts(prev => [...prev, { ...props, id }]);

    if ((props.duration ?? 5000) > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, props.duration);
    }
  };

  const dismiss = (id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(t => t.id !== id));
    } else {
      setToasts([]);
    }
  };

  return { toast, dismiss, toasts };
}