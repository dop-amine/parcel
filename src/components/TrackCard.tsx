'use client';

import { type Track, type User } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import WaveformPlayer from "./WaveformPlayer";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    description: string | null;
    audioUrl: string;
    coverUrl: string | null;
    bpm: number | null;
    duration: number;
    genres: string[];
    moods: string[];
    waveformData?: number[] | null;
    createdAt: string | Date;
    userId: string;
    artist: {
      id: string;
      name: string | null;
      image: string | null;
    };
    url: string;
  };
  className?: string;
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function TrackCard({ track, className }: TrackCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{track.title}</h3>
        <p className="text-sm text-muted-foreground">by {track.artist.name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(track.createdAt).toLocaleDateString()}
        </p>
      </div>
      {isVisible && (
        <WaveformPlayer
          url={track.audioUrl}
          trackId={track.id}
          onPlay={() => {
            // Handle play event
          }}
          onPause={() => {
            // Handle pause event
          }}
        />
      )}
    </div>
  );
}