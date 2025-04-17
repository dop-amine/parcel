'use client';

import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Suspense } from 'react';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function TracksList() {
  const { data: tracks, isLoading } = api.track.getMyTracks.useQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (tracks?.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">No tracks uploaded yet</h2>
        <Link
          href="/artist/upload"
          className="text-primary hover:underline"
        >
          Upload your first track
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks?.map((track) => (
        <div
          key={track.id}
          className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{track.title}</h3>
            {track.description && (
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {track.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {track.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-primary/10 text-primary text-sm px-2 py-1 rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{formatDistanceToNow(new Date(track.createdAt), { addSuffix: true })}</span>
              <span>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="bg-muted p-4 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Plays: {track._count.plays}</p>
              <p className="text-sm font-medium">Purchases: {track._count.purchases}</p>
            </div>
            <Link
              href={`/artist/tracks/${track.id}`}
              className="text-primary hover:underline text-sm"
            >
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ArtistTracks() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view your tracks</h1>
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'ARTIST') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Only artists can view tracks</h1>
          <Link href="/" className="text-primary hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Tracks</h1>
        <Link
          href="/artist/upload"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Upload New Track
        </Link>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <TracksList />
      </Suspense>
    </div>
  );
}