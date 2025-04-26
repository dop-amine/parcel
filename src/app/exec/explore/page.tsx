'use client';

import { useState } from "react";
import { api } from "@/utils/api";
import TrackCard from "@/components/TrackCard";
import SidebarFilters from "@/components/SidebarFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/stores/playerStore";
import { useSession } from 'next-auth/react';

export default function ExplorePage() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [bpmMin, setBpmMin] = useState<string>("");
  const [bpmMax, setBpmMax] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = api.track.getAllPublic.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: likedTracksData } = api.like.getLikedTracks.useQuery();
  const likedTrackIds = new Set((likedTracksData ?? []).map((like: any) => like.track.id));

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
      <div className="min-h-screen">
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
      <div className="min-h-screen">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-lg bg-red-900/50 p-4 text-red-400">
            Error loading tracks: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-1">
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
                        track={track}
                        onClickTag={handleTagClick}
                        liked={likedTrackIds.has(track.id)}
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