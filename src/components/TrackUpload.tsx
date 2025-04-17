'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';
import MultiSelect from './MultiSelect';
import { GENRES, MOODS } from '@/constants/music';
import type { PutBlobResult } from '@vercel/blob';
import { Button } from '@/components/ui/button';

// 100MB in bytes
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function TrackUpload() {
  const { data: session, status } = useSession();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bpm, setBpm] = useState<string>('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTrack = api.track.create.useMutation({
    onSuccess: () => {
      router.push('/artist/tracks');
    },
  });

  const uploadAndCreate = api.track.uploadAndCreate.useMutation({
    onSuccess: () => {
      router.push('/artist/tracks');
    },
  });

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
    }
    if (!file.type.startsWith('audio/')) {
      throw new Error('Please upload an audio file');
    }
    return true;
  };

  const loadAudioMetadata = (file: File) => {
    const url = URL.createObjectURL(file);
    const audio = audioRef.current;
    if (audio) {
      audio.src = url;
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
        URL.revokeObjectURL(url);
      };
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    try {
      validateFile(droppedFile);
      setFile(droppedFile);
      loadAudioMetadata(droppedFile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid file');
      setFile(null);
    }
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      validateFile(selectedFile);
      setFile(selectedFile);
      loadAudioMetadata(selectedFile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid file');
      setFile(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    if (selectedGenres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Vercel Blob using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<{ url: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Failed to upload file'));
            } catch (err) {
              reject(new Error('Failed to upload file'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      const { url } = await uploadPromise;

      // Create track record
      await uploadAndCreate.mutateAsync({
        title,
        description,
        audioUrl: url,
        duration,
        genres: selectedGenres,
        moods: selectedMoods,
        bpm: bpm ? parseInt(bpm) : undefined,
      });

      // Reset form and navigate immediately
      router.push('/artist/tracks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please log in to upload tracks</div>;
  }

  if (session.user.role !== 'ARTIST') {
    return <div>Only artists can upload tracks</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-2 h-[calc(100vh-4rem)] flex flex-col gap-2">
      <audio ref={audioRef} className="hidden" />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Track Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-8 rounded-md border-border text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="bpm" className="block text-sm font-medium">
            BPM
          </label>
          <input
            type="number"
            id="bpm"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className="w-full h-8 rounded-md border-border text-sm"
            min="1"
            max="999"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border-border text-sm min-h-[60px] max-h-[60px]"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MultiSelect
          options={GENRES}
          selected={selectedGenres}
          onChange={setSelectedGenres}
          label="Genres *"
          error={selectedGenres.length === 0 ? 'Please select at least one genre' : undefined}
        />

        <MultiSelect
          options={MOODS}
          selected={selectedMoods}
          onChange={setSelectedMoods}
          label="Moods"
        />
      </div>

      <div className="flex-none">
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {file ? (
            <div className="space-y-2">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • {formatDuration(duration)}
                </p>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading || !title || selectedGenres.length === 0}
                className="w-full h-8"
                variant="default"
              >
                {uploading ? "Uploading..." : "Upload Track"}
              </Button>
            </div>
          ) : (
            <>
              <p className="font-medium">
                Drag and drop your audio file here, or click to select
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Supported formats: WAV, FLAC, AAC, MP3
              </p>
              <input
                type="file"
                accept="audio/*"
                onChange={onFileSelect}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-8"
              >
                Select File
              </Button>
            </>
          )}
        </div>

        {uploading && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2 text-destructive text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}