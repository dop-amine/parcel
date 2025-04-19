'use client';

import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Suspense } from 'react';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
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
        <h2 className="text-xl font-semibold text-white mb-4">No tracks uploaded yet</h2>
        <Link
          href="/artist/upload"
          className="text-purple-400 hover:text-purple-300 transition-colors"
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
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-all"
        >
          <div className="p-4">
            <h3 className="text-xl font-semibold text-white mb-2">{track.title}</h3>
            {track.description && (
              <p className="text-gray-400 mb-4 line-clamp-2">
                {track.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {track.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-purple-900/50 text-purple-200 text-sm px-2 py-1 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{formatDistanceToNow(new Date(track.createdAt), { addSuffix: true })}</span>
              <span>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}</span>
            </div>
          </div>
          <div className="bg-gray-800/50 p-4 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-300">Plays: {track._count.plays}</p>
              <p className="text-sm font-medium text-gray-300">Purchases: {track._count.purchases}</p>
            </div>
            <Link
              href={`/artist/tracks/${track.id}`}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
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
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to view your tracks</h1>
          <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300 transition-colors">
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
          <h1 className="text-2xl font-bold text-white mb-4">Only artists can view tracks</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">My Tracks</h1>
        <Link
          href="/artist/upload"
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
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