"use client";

import { Menu, User, UserCheck } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  connectionState: string;
  peerId?: string | null;
  otherPeerId?: string | null;
  onDisconnect?: () => void;
}

export function Header({ connectionState, peerId, otherPeerId, onDisconnect }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isConnected = connectionState === "connected";
  const hasPeer = peerId && otherPeerId;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">
              AetherShare
            </h1>
            <p className="text-xs text-muted-foreground">P2P File Transfer</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Connection</div>
              <div className="text-sm font-medium flex items-center gap-1">
                {isConnected ? (
                  hasPeer ? (
                    <>
                      <UserCheck className="h-3 w-3 text-teal-400" />
                      <span className="text-teal-500">• Connected to {otherPeerId?.slice(-4)}</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 text-teal-400" />
                      <span className="text-teal-500">• Waiting for peer</span>
                    </>
                  )
                ) : (
                  <span className="text-foreground/50">• Disconnected</span>
                )}
              </div>
            </div>

            {isConnected && onDisconnect && (
              <button
                onClick={onDisconnect}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Leave
              </button>
            )}
          </div>

          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur">
          <nav className="flex flex-col gap-1 p-4">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              GitHub
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}