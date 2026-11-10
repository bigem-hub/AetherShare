import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AetherShare - Ultra-Fast P2P File Transfer",
  description: "Secure, direct peer-to-peer file transfer using WebRTC. No servers, no file size limits, zero storage.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "AetherShare - Direct P2P File Transfer",
    description: "Peer-to-peer file transfer using WebRTC - No servers, no uploads, end-to-end encrypted",
  },
};

export const viewport = {
  themeColor: "#0d1017",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0d1017] font-sans text-[#f4efe1] antialiased selection:bg-[#92b6b1]/30 selection:text-[#e8ddb5]">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Ambient Nordic palette orbs */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[520px] rounded-full bg-gradient-to-tr from-[#666a86]/25 via-[#788aa3]/20 to-[#92b6b1]/20 blur-[140px]" />
          <div className="absolute top-1/3 -left-48 w-[650px] h-[650px] rounded-full bg-[#b2c9ab]/10 blur-[160px]" />
          <div className="absolute bottom-0 -right-48 w-[650px] h-[650px] rounded-full bg-[#666a86]/20 blur-[160px]" />
          <div className="absolute top-2/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#e8ddb5]/5 blur-[130px]" />
        </div>
        {children}
      </body>
    </html>
  );
}