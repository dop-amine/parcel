'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '@/lib/utils';

interface WaveformPlayerProps {
  url: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

// Create a single WaveSurfer instance that persists across renders
let globalWaveSurfer: WaveSurfer | null = null;

export default function WaveformPlayer({
  url,
  isPlaying,
  onPlay,
  onPause,
  onTimeUpdate,
  className,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WaveSurfer once
  useEffect(() => {
    if (!containerRef.current || globalWaveSurfer) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4B5563',
      progressColor: '#9333EA',
      cursorColor: '#9333EA',
      barWidth: 2,
      barRadius: 3,
      barGap: 2,
      height: 40,
      normalize: true,
      backend: 'MediaElement',
    });

    globalWaveSurfer = wavesurfer;

    const handleReady = () => {
      if (!wavesurfer) return;
      setDuration(wavesurfer.getDuration());
      setIsReady(true);
      if (isPlaying) {
        wavesurfer.play();
      }
    };

    const handleAudioProcess = () => {
      if (!wavesurfer) return;
      const time = wavesurfer.getCurrentTime();
      setCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handlePlay = () => {
      onPlay?.();
    };

    const handlePause = () => {
      onPause?.();
    };

    wavesurfer.on('ready', handleReady);
    wavesurfer.on('audioprocess', handleAudioProcess);
    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);

    setIsInitialized(true);

    return () => {
      wavesurfer.pause();
      wavesurfer.unAll();
    };
  }, []);

  // Handle URL changes
  useEffect(() => {
    const wavesurfer = globalWaveSurfer;
    if (!wavesurfer || !isInitialized) return;

    const loadAudio = async () => {
      try {
        wavesurfer.pause();
        setIsReady(false);
        await wavesurfer.load(url);
        setIsReady(true);
        if (isPlaying) {
          await wavesurfer.play();
        }
      } catch (error) {
        console.error('Error loading audio:', error);
        setIsReady(false);
      }
    };

    loadAudio();
  }, [url, isInitialized, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    const wavesurfer = globalWaveSurfer;
    if (!wavesurfer || !isReady || !isInitialized) return;

    const togglePlayPause = async () => {
      try {
        const isCurrentlyPlaying = wavesurfer.isPlaying();
        if (isPlaying && !isCurrentlyPlaying) {
          await wavesurfer.play();
        } else if (!isPlaying && isCurrentlyPlaying) {
          wavesurfer.pause();
        }
      } catch (error) {
        console.error('Error toggling play state:', error);
      }
    };

    togglePlayPause();
  }, [isPlaying, isReady, isInitialized]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
      <div ref={containerRef} className="flex-1" />
      <span className="text-xs text-gray-400">{formatTime(duration)}</span>
    </div>
  );
}