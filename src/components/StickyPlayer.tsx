'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, ShoppingCart, Play, Pause, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/stores/playerStore";
import WaveformPlayer from "./WaveformPlayer";
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function StickyPlayer() {
  const pathname = usePathname();
  const { currentTrack, isPlaying, isMinimized, togglePlay, toggleMinimized, setMinimized, setPlaying } = usePlayerStore();

  // Auto-minimize when navigating away from explore page
  useEffect(() => {
    if (pathname !== '/explore') {
      setMinimized(true);
    }
  }, [pathname, setMinimized]);

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm"
    >
      <div className="container mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isPlaying) {
                    setPlaying(false);
                  } else {
                    setPlaying(true);
                  }
                }}
                className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div>
                <h3 className="text-sm font-medium text-white">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-gray-400">
                  {currentTrack.artist.name || "Unknown Artist"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMinimized}
                className="text-gray-400 hover:text-white"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className={cn(
            "transition-all duration-300",
            isMinimized ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-100"
          )}>
            <WaveformPlayer
              url={currentTrack.audioUrl}
              isPlaying={isPlaying}
              onPlay={togglePlay}
              onPause={togglePlay}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}