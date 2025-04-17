'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { getWaveformData } from '@/utils/cache';

// Global state to track the currently playing audio
let globalWaveSurfer: WaveSurfer | null = null;

interface WaveformPlayerProps {
  url: string;
  trackId: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export default function WaveformPlayer({ url, trackId, onPlay, onPause, className }: WaveformPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const isDestroyed = useRef(false);
  const cleanupTimeout = useRef<NodeJS.Timeout>();
  const initTimeout = useRef<NodeJS.Timeout>();

  // Load waveform data when component mounts
  useEffect(() => {
    const loadWaveformData = async () => {
      try {
        const data = await getWaveformData(trackId);
        setWaveformData(data);
      } catch (error) {
        console.error('Error loading waveform data:', error);
      }
    };

    loadWaveformData();
  }, [trackId]);

  // Stop other audio players when this one plays
  const stopOtherPlayers = useCallback(() => {
    if (globalWaveSurfer && globalWaveSurfer !== wavesurfer.current) {
      globalWaveSurfer.pause();
    }
    globalWaveSurfer = wavesurfer.current;
  }, []);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) {
      console.warn('Waveform container not found');
      return;
    }

    console.log('Initializing WaveSurfer with URL:', url);
    isDestroyed.current = false;
    setIsLoading(true);
    setError(null);
    setDuration(0);
    setCurrentTime(0);

    // Clean up any existing instance
    if (wavesurfer.current) {
      try {
        wavesurfer.current.destroy();
      } catch (error) {
        console.warn('Error cleaning up existing WaveSurfer instance:', error);
      }
      wavesurfer.current = null;
    }

    // Clear any existing initialization timeout
    if (initTimeout.current) {
      clearTimeout(initTimeout.current);
    }

    // Wait for the next tick to ensure the container is ready
    initTimeout.current = setTimeout(async () => {
      try {
        const ws = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: '#4F46E5',
          progressColor: '#818CF8',
          cursorColor: '#6366F1',
          barWidth: 2,
          barGap: 1,
          height: 60,
          barRadius: 2,
          normalize: true,
          backend: 'WebAudio',
          cursorWidth: 1,
          hideScrollbar: true,
          minPxPerSec: 1,
          fillParent: true,
          interact: true,
          dragToSeek: true,
        });

        wavesurfer.current = ws;

        const loadAudio = async () => {
          try {
            console.log('Loading audio from URL:', url);
            if (waveformData) {
              // If we have pre-generated waveform data, use it
              await ws.load(url, [waveformData]);
            } else {
              // Otherwise, let WaveSurfer generate the waveform
              await ws.load(url);
            }
            console.log('Audio loaded successfully');
            setIsLoading(false);
          } catch (error) {
            console.error('Error loading audio:', error);
            setError('Failed to load audio');
            setIsLoading(false);
          }
        };

        loadAudio();

        ws.on('ready', () => {
          console.log('WaveSurfer ready');
          if (!isDestroyed.current) {
            const newDuration = ws.getDuration();
            console.log('Setting duration:', newDuration);
            setDuration(newDuration);
          }
        });

        ws.on('error', (error) => {
          console.error('WaveSurfer error:', error);
          setError('Error initializing waveform');
          setIsLoading(false);
        });

        ws.on('audioprocess', (time: number) => {
          if (!isDestroyed.current) {
            setCurrentTime(time);
          }
        });

        // @ts-ignore - WaveSurfer types are incomplete for the 'seek' event
        ws.on('seek', (progress: number) => {
          if (!isDestroyed.current && duration > 0) {
            const newTime = progress * duration;
            if (isFinite(newTime)) {
              setCurrentTime(newTime);
            }
          }
        });

        ws.on('interaction', () => {
          if (!isDestroyed.current && duration > 0) {
            const time = ws.getCurrentTime();
            if (isFinite(time)) {
              setCurrentTime(time);
            }
          }
        });

        ws.on('play', () => {
          if (!isDestroyed.current) {
            stopOtherPlayers();
            setIsPlaying(true);
            onPlay?.();
          }
        });

        ws.on('pause', () => {
          if (!isDestroyed.current) {
            setIsPlaying(false);
            onPause?.();
          }
        });

        ws.on('finish', () => {
          if (!isDestroyed.current) {
            setIsPlaying(false);
            onPause?.();
          }
        });
      } catch (error) {
        console.error('Error creating WaveSurfer instance:', error);
        setError('Error initializing waveform');
        setIsLoading(false);
      }
    }, 0);

    return () => {
      console.log('Cleaning up WaveSurfer');
      isDestroyed.current = true;

      if (initTimeout.current) {
        clearTimeout(initTimeout.current);
      }
      if (cleanupTimeout.current) {
        clearTimeout(cleanupTimeout.current);
      }

      const cleanup = () => {
        if (!wavesurfer.current) return;

        try {
          if (wavesurfer.current.isPlaying()) {
            wavesurfer.current.pause();
          }
          wavesurfer.current.unAll();
          if (waveformRef.current) {
            waveformRef.current.innerHTML = '';
          }
          wavesurfer.current.destroy();
          wavesurfer.current = null;
        } catch (error) {
          console.warn('Error during WaveSurfer cleanup:', error);
        }
      };

      cleanupTimeout.current = setTimeout(cleanup, 0);
    };
  }, [url, waveformData, onPlay, onPause, stopOtherPlayers]);

  const handlePlayPause = useCallback(() => {
    if (wavesurfer.current && !isDestroyed.current) {
      if (isPlaying) {
        wavesurfer.current.pause();
        onPause?.();
      } else {
        stopOtherPlayers();
        wavesurfer.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, onPlay, onPause, stopOtherPlayers]);

  return (
    <div className={className}>
      <div ref={waveformRef} className="mb-4 w-full" />
      {isLoading && (
        <div className="h-[60px] w-full animate-pulse rounded-md bg-muted" />
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePlayPause}
          className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <div className="flex-1 text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}