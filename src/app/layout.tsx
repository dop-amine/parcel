import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/audio-player.css";
import { Providers } from "./providers";
import StickyPlayer from "@/components/StickyPlayer";
import PlayerPaddingWrapper from "@/components/PlayerPaddingWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parcel - Music Platform",
  description: "Discover and share music with the world",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen bg-gradient-to-b from-black to-purple-900/20">
          <Providers>
            <PlayerPaddingWrapper>
              {children}
            </PlayerPaddingWrapper>
          </Providers>
          <StickyPlayer />
        </div>
      </body>
    </html>
  );
}
