'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, ShoppingCart, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/playerStore";
import PurchaseDialog from "./PurchaseDialog";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    artist: {
      id: string;
      name: string | null;
      image: string | null;
    };
    coverUrl: string | null;
    audioUrl: string;
    bpm: number | null;
    genres: string[];
    moods: string[];
    price?: number;
    isNegotiable?: boolean;
  };
  onClickTag?: (tag: string) => void;
}

export default function TrackCard({ track, onClickTag }: TrackCardProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay, setPlaying } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-transform hover:scale-[1.02]"
      >
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">{track.title}</h3>
              <p className="text-xs text-gray-400">{track.artist.name || "Unknown Artist"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isCurrentTrack) {
                  togglePlay();
                } else {
                  setTrack(track);
                  setPlaying(true);
                }
              }}
              className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {track.genres.map((genre) => (
              <Button
                key={genre}
                variant="outline"
                size="sm"
                onClick={() => onClickTag?.(genre)}
                className="h-6 rounded-full border-gray-800 bg-gray-900/50 px-2 text-xs text-gray-400 hover:bg-gray-800/50"
              >
                {genre}
              </Button>
            ))}
            {track.moods.map((mood) => (
              <Button
                key={mood}
                variant="outline"
                size="sm"
                onClick={() => onClickTag?.(mood)}
                className="h-6 rounded-full border-gray-800 bg-gray-900/50 px-2 text-xs text-gray-400 hover:bg-gray-800/50"
              >
                {mood}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{track.bpm || 0} BPM</span>
            <div className="flex items-center gap-2">
              {track.price !== undefined && (
                <span className="text-sm font-medium text-white">
                  ${track.price.toFixed(2)}
                  {track.isNegotiable && (
                    <span className="ml-1 text-xs text-gray-400">(Negotiable)</span>
                  )}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPurchaseDialogOpen(true)}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        track={track}
      />
    </>
  );
}