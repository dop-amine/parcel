"use client";

import { trpc } from "@/utils/trpc";
import { motion } from "framer-motion";
import { Play, DollarSign, Music } from "lucide-react";

type Track = {
  id: string;
  title: string;
  description: string | null;
};

export default function ArtistDashboard() {
  const { data: stats, isLoading: isLoadingStats } = trpc.artist.getStats.useQuery();
  const { data: recentTracks, isLoading: isLoadingTracks } = trpc.track.getRecent.useQuery();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's an overview of your music.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingStats ? (
          <>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg animate-pulse" />
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg animate-pulse" />
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg animate-pulse" />
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600/10 rounded-lg group-hover:bg-purple-600/20 transition-colors">
                  <Music className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Tracks</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalTracks || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600/10 rounded-lg group-hover:bg-green-600/20 transition-colors">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Plays</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalPlays || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-lg hover:bg-gray-800/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-600/10 rounded-lg group-hover:bg-yellow-600/20 transition-colors">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">${stats?.totalEarnings || 0}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Recent Tracks */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Recent Tracks</h2>
        {isLoadingTracks ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-4 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentTracks?.map((track: Track) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={track.id}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-4 rounded-lg hover:bg-gray-800/50 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{track.title}</h3>
                    <p className="text-sm text-gray-400">{track.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}