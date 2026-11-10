import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AetherShare",
  description: "P2P File Transfer using WebRTC",
  manifest: "/manifest.json",
  openGraph: {
    title: "AetherShare",
    description: "Peer-to-peer file transfer using WebRTC - No servers, no uploads",
  },
};

export const viewport = {
  themeColor: "#05060a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}