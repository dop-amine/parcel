"use client";

import { trpc } from "@/utils/trpc";

type Track = {
  id: string;
  title: string;
  description: string | null;
};

export default function ArtistDashboard() {
  const { data: stats, isLoading: isLoadingStats } = trpc.artist.getStats.useQuery();
  const { data: recentTracks, isLoading: isLoadingTracks } = trpc.track.getRecent.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s an overview of your music.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingStats ? (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse" />
            <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse" />
            <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse" />
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Tracks</h3>
              <p className="text-2xl font-semibold">{stats?.totalTracks || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Plays</h3>
              <p className="text-2xl font-semibold">{stats?.totalPlays || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
              <p className="text-2xl font-semibold">${stats?.totalEarnings || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Recent Tracks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Tracks</h2>
        {isLoadingTracks ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentTracks?.map((track: Track) => (
              <div key={track.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div>
                    <h3 className="font-medium">{track.title}</h3>
                    <p className="text-sm text-gray-500">{track.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}