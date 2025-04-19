'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import WaveSurfer from 'wavesurfer.js';
import { GENRES, MOODS } from '@/constants/music';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function TrackUpload() {
  const router = useRouter();
  const uploadMutation = api.track.uploadAndCreate.useMutation();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [bpm, setBpm] = useState<number | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateWaveformData = async (audioUrl: string): Promise<number[]> => {
    // Create a temporary WaveSurfer instance
    const ws = WaveSurfer.create({
      container: document.createElement('div'),
      backend: 'WebAudio',
    });

    try {
      // Load the audio
      await ws.load(audioUrl);

      // Get the peaks (waveform data)
      const peaks = ws.exportPeaks({ maxLength: 1000 }); // Get 1000 points for the waveform

      // Clean up
      ws.destroy();

      // Convert to single channel if needed
      return peaks[0] || [];
    } catch (err) {
      ws.destroy();
      throw err;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove file extension
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload the audio file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { url: audioUrl } = await uploadResponse.json();

      // Generate waveform data
      const ws = WaveSurfer.create({
        container: document.createElement('div'),
        height: 100,
        waveColor: '#4f46e5',
        progressColor: '#4338ca',
        cursorColor: '#4338ca',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        backend: 'WebAudio',
      });

      await ws.load(audioUrl);
      const peaks = ws.exportPeaks({ maxLength: 1000 });
      const waveformData = peaks[0]; // Use the first channel's peaks
      ws.destroy();

      // Create the track
      await uploadMutation.mutateAsync({
        title,
        description,
        genres,
        moods,
        bpm: bpm ? parseInt(bpm.toString()) : undefined,
        audioUrl,
        duration: ws.getDuration(),
        waveformData,
      });

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setGenres([]);
      setMoods([]);
      setBpm(undefined);
      setIsUploading(false);
      router.push('/artist/tracks');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400">
          Audio File
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-800 text-sm font-medium rounded-md text-white bg-gray-900/50 hover:bg-gray-800/50 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Select File
          </button>
          {file && (
            <span className="ml-4 text-sm text-gray-400">
              {file.name}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-900/50 border-gray-800 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 sm:text-sm backdrop-blur-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md bg-gray-900/50 border-gray-800 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 sm:text-sm backdrop-blur-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            BPM
          </label>
          <input
            type="number"
            value={bpm || ''}
            onChange={(e) => setBpm(e.target.value ? parseInt(e.target.value) : undefined)}
            min={60}
            max={200}
            className="block w-full rounded-md bg-gray-900/50 border-gray-800 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 sm:text-sm backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Genres
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50"
              >
                {genres.length > 0
                  ? `${genres.length} selected`
                  : "Select genres..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-gray-900/95 border-gray-800">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search genres..."
                  className="w-full px-2 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="max-h-[200px] overflow-auto space-y-1">
                  {GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => {
                        if (genres.includes(genre.id)) {
                          setGenres(genres.filter(g => g !== genre.id));
                        } else {
                          setGenres([...genres, genre.id]);
                        }
                      }}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 text-sm rounded-md",
                        genres.includes(genre.id)
                          ? "bg-purple-600 text-white"
                          : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          genres.includes(genre.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {genre.label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Moods
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800/50"
              >
                {moods.length > 0
                  ? `${moods.length} selected`
                  : "Select moods..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-gray-900/95 border-gray-800">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search moods..."
                  className="w-full px-2 py-1 text-sm bg-gray-800/50 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="max-h-[200px] overflow-auto space-y-1">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => {
                        if (moods.includes(mood.id)) {
                          setMoods(moods.filter(m => m !== mood.id));
                        } else {
                          setMoods([...moods, mood.id]);
                        }
                      }}
                      className={cn(
                        "flex items-center w-full px-2 py-1.5 text-sm rounded-md",
                        moods.includes(mood.id)
                          ? "bg-purple-600 text-white"
                          : "text-gray-200 hover:bg-gray-800"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          moods.includes(mood.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isUploading && (
        <div className="w-full bg-gray-800 rounded-full h-2.5">
          <div
            className="bg-purple-600 h-2.5 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-900/50 border border-red-800 p-4">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || !file || genres.length === 0 || moods.length === 0}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? 'Uploading...' : 'Upload Track'}
      </button>
    </div>
  );
}