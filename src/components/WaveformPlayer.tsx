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

export default function WaveformPlayer({
  url,
  isPlaying,
  onPlay,
  onPause,
  onTimeUpdate,
  className,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

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
      media: audio,
    });

    wavesurferRef.current = wavesurfer;

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

    const handleError = (err: Error) => {
      console.error('WaveSurfer error:', err);
      setIsReady(false);
    };

    wavesurfer.on('ready', handleReady);
    wavesurfer.on('audioprocess', handleAudioProcess);
    wavesurfer.on('error', handleError);

    return () => {
      wavesurfer.pause();
      wavesurfer.unAll();
      wavesurfer.destroy();
      wavesurferRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle URL changes
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    const audio = audioRef.current;
    if (!wavesurfer || !audio) return;

    const loadAudio = async () => {
      try {
        setIsReady(false);
        wavesurfer.pause();
        audio.src = url;
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
  }, [url]);

  // Handle play/pause
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || !isReady) return;

    if (isPlaying) {
      wavesurfer.play();
    } else {
      wavesurfer.pause();
    }
  }, [isPlaying, isReady]);

  // Handle WaveSurfer events
  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer) return;

    const handlePlay = () => {
      if (!isPlaying) {
        onPlay?.();
      }
    };

    const handlePause = () => {
      if (isPlaying) {
        onPause?.();
      }
    };

    wavesurfer.on('play', handlePlay);
    wavesurfer.on('pause', handlePause);

    return () => {
      wavesurfer.un('play', handlePlay);
      wavesurfer.un('pause', handlePause);
    };
  }, [isPlaying, onPlay, onPause]);

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