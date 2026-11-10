"use client";

import { Menu, User, UserCheck, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  connectionState: string;
  peerId?: string | null;
  otherPeerId?: string | null;
  onDisconnect?: () => void;
}

export function Header({ connectionState, peerId, otherPeerId, onDisconnect }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isConnected = connectionState === "connected" || Boolean(peerId);
  const hasPeer = Boolean(peerId && otherPeerId);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-[#666a86]/30 bg-[#0d1017]/85 backdrop-blur-xl transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#666a86] via-[#788aa3] to-[#92b6b1] p-[2px] shadow-lg shadow-[#92b6b1]/20 ring-1 ring-white/10">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0d1017] p-1.5">
              <svg viewBox="0 0 64 64" fill="none" className="h-full w-full drop-shadow-[0_0_6px_rgba(178,201,171,0.4)]">
                <path d="M 18 36 C 18 24, 30 18, 38 22 C 45 26, 48 35, 43 41 C 38 47, 26 46, 22 41" stroke="#788aa3" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
                <path d="M 46 28 C 46 40, 34 46, 26 42 C 19 38, 16 29, 21 23 C 26 17, 38 18, 42 23" stroke="#b2c9ab" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
                <circle cx="21" cy="30" r="4" fill="#788aa3" />
                <circle cx="43" cy="34" r="4" fill="#92b6b1" />
                <circle cx="32" cy="32" r="3" fill="#e8ddb5" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#e8ddb5] via-[#b2c9ab] to-[#92b6b1] bg-clip-text text-transparent">
                AetherShare
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#92b6b1]/15 px-2 py-0.5 text-[10px] font-semibold text-[#b2c9ab] ring-1 ring-[#92b6b1]/30">
                <ShieldCheck className="h-3 w-3" /> P2P Encrypted
              </span>
            </div>
            <p className="text-xs text-[#788aa3]">Direct WebRTC Transfer</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#788aa3]">
          <span className="flex items-center gap-1.5 text-xs text-[#b2c9ab]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#92b6b1] animate-pulse" />
            Zero Server Storage
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-[#666a86]/30 bg-[#131722]/80 px-3.5 py-1.5 text-xs backdrop-blur-md">
            {isConnected ? (
              hasPeer ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b2c9ab] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b2c9ab]" />
                  </span>
                  <span className="font-medium text-[#b2c9ab]">
                    Connected to <span className="font-mono text-[#e8ddb5]">{otherPeerId?.slice(-4)}</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e8ddb5] animate-pulse" />
                  </span>
                  <span className="font-medium text-[#e8ddb5]">Waiting for peer</span>
                </>
              )
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[#666a86]" />
                <span className="text-[#788aa3]">Disconnected</span>
              </>
            )}

            {isConnected && onDisconnect && (
              <button
                onClick={onDisconnect}
                className="ml-1.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                Leave
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}