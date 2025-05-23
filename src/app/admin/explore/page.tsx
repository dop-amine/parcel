'use client';

import { useState } from "react";
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { api } from "@/utils/api";
import TrackCard from "@/components/TrackCard";
import SidebarFilters from "@/components/SidebarFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/stores/playerStore";
import { Shield, Users, Music, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminExplore() {
  const { data: session, status } = useSession();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [bpmMin, setBpmMin] = useState<string>("");
  const [bpmMax, setBpmMax] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error, refetch } = api.track.getAllPublic.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: likedTracksData } = api.like.getLikedTracks.useQuery();
  const likedTrackIds = new Set((likedTracksData ?? []).map((like: any) => like.track.id));

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedMoods([]);
    setBpmMin("");
    setBpmMax("");
    setSearchQuery("");
  };

  const handleFilterUpdate = (updates: {
    selectedGenres?: string[];
    selectedMoods?: string[];
    bpmMin?: string;
    bpmMax?: string;
    searchQuery?: string;
  }) => {
    if (updates.selectedGenres !== undefined) {
      setSelectedGenres(updates.selectedGenres);
    }
    if (updates.selectedMoods !== undefined) {
      setSelectedMoods(updates.selectedMoods);
    }
    if (updates.bpmMin !== undefined) {
      setBpmMin(updates.bpmMin);
    }
    if (updates.bpmMax !== undefined) {
      setBpmMax(updates.bpmMax);
    }
    if (updates.searchQuery !== undefined) {
      setSearchQuery(updates.searchQuery);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedGenres.includes(tag)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== tag));
    } else if (selectedMoods.includes(tag)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== tag));
    } else {
      // Try to find the tag in genres first, then moods
      const genre = data?.tracks.find((t) => t.genres.includes(tag));
      if (genre) {
        setSelectedGenres([...selectedGenres, tag]);
      } else {
        setSelectedMoods([...selectedMoods, tag]);
      }
    }
  };

  const filteredTracks = data?.tracks.filter((track) => {
    if (selectedGenres.length > 0 && !selectedGenres.some((genre) => track.genres.includes(genre))) {
      return false;
    }
    if (selectedMoods.length > 0 && !selectedMoods.some((mood) => track.moods.includes(mood))) {
      return false;
    }
    if (bpmMin && track.bpm && track.bpm < parseInt(bpmMin)) {
      return false;
    }
    if (bpmMax && track.bpm && track.bpm > parseInt(bpmMax)) {
      return false;
    }
    if (searchQuery && !track.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        {/* Admin Header */}
        <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Explore</h1>
          </div>
          <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-500/50">
            ADMIN
          </Badge>
        </header>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <Skeleton className="h-[600px] rounded-lg" />
            </div>
            <div className="md:col-span-3">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        {/* Admin Header */}
        <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Explore</h1>
          </div>
          <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-500/50">
            ADMIN
          </Badge>
        </header>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
            Error loading tracks: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Admin Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-green-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Explore</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Admin Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Music className="h-4 w-4" />
              <span>{data?.tracks.length || 0} total tracks</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="h-4 w-4" />
              <span>{new Set(data?.tracks.map(t => t.user?.id)).size || 0} artists</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-500/50">
            ADMIN
          </Badge>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">Admin Filters</h2>
              <p className="text-sm text-gray-400 mb-4">Full platform oversight and content moderation</p>
            </div>
            <SidebarFilters
              selectedGenres={selectedGenres}
              selectedMoods={selectedMoods}
              bpmMin={bpmMin}
              bpmMax={bpmMax}
              searchQuery={searchQuery}
              onUpdate={handleFilterUpdate}
              onClear={clearFilters}
            />
          </div>

          <div className="md:col-span-3">
            {/* Admin Controls */}
            <div className="mb-6 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-2">Admin Controls</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Viewing {filteredTracks?.length || 0} of {data?.tracks.length || 0} tracks</span>
                </div>
                <span>&bull;</span>
                <span>Content moderation and track management available</span>
              </div>
            </div>

            {filteredTracks?.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center"
              >
                <h3 className="mb-2 text-xl font-semibold text-white">No tracks found</h3>
                <p className="text-gray-400">
                  Try adjusting your filters or search query to find what you're looking for.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredTracks?.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TrackCard
                        track={{
                          ...track,
                          artist: track.artist ?? { id: '', name: null, profilePicture: null }
                        }}
                        onClickTag={handleTagClick}
                        liked={likedTrackIds.has(track.id)}
                        isAdmin={true}
                        onRefetch={refetch}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}