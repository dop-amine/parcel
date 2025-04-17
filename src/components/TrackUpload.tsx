'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import WaveSurfer from 'wavesurfer.js';
import { GENRES, MOODS } from '@/constants/music';

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
        <label className="block text-sm font-medium text-gray-700">
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Select File
          </button>
          {file && (
            <span className="ml-4 text-sm text-gray-500">
              {file.name}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          BPM
        </label>
        <input
          type="number"
          value={bpm || ''}
          onChange={(e) => setBpm(e.target.value ? parseInt(e.target.value) : undefined)}
          min={60}
          max={200}
          className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Genres
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => {
                if (genres.includes(genre.id)) {
                  setGenres(genres.filter(g => g !== genre.id));
                } else {
                  setGenres([...genres, genre.id]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                genres.includes(genre.id)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {genre.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Moods
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => {
                if (moods.includes(mood.id)) {
                  setMoods(moods.filter(m => m !== mood.id));
                } else {
                  setMoods([...moods, mood.id]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                moods.includes(mood.id)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={isUploading || !file || genres.length === 0 || moods.length === 0}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload Track'}
      </button>
    </div>
  );
}