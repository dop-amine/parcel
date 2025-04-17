'use client';

import { useState } from "react";
import { api } from "@/utils/api";
import { GENRES, MOODS } from "@/constants/music";
import TrackCard from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

export default function ExplorePage() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [bpmMin, setBpmMin] = useState<string>("");
  const [bpmMax, setBpmMax] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = api.track.getAllPublic.useQuery({
    page: 1,
    limit: 100,
  });

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedMoods([]);
    setBpmMin("");
    setBpmMax("");
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleMood = (moodId: string) => {
    setSelectedMoods(prev =>
      prev.includes(moodId)
        ? prev.filter(id => id !== moodId)
        : [...prev, moodId]
    );
  };

  const filteredTracks = data?.tracks.filter(track => {
    if (selectedGenres.length > 0 && !selectedGenres.some(genre => track.genres.includes(genre))) {
      return false;
    }
    if (selectedMoods.length > 0 && !selectedMoods.some(mood => track.moods.includes(mood))) {
      return false;
    }
    if (bpmMin && track.bpm && track.bpm < parseInt(bpmMin)) {
      return false;
    }
    if (bpmMax && track.bpm && track.bpm > parseInt(bpmMax)) {
      return false;
    }
    return true;
  });

  const activeFilters = selectedGenres.length + selectedMoods.length + (bpmMin ? 1 : 0) + (bpmMax ? 1 : 0);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
              <Skeleton className="mb-4 h-6 w-3/4" />
              <Skeleton className="h-[60px] w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          Error loading tracks: {error.message}
        </div>
      </div>
    );
  }

  if (!data?.tracks || data.tracks.length === 0) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <p className="text-muted-foreground">No tracks found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Explore</h1>
        <div className="flex items-center gap-2">
          {activeFilters > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {activeFilters} {activeFilters === 1 ? 'filter' : 'filters'}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 gap-1.5 px-2.5 text-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-lg border bg-card/50 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Filters</h2>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">Genres</h3>
              <div className="flex flex-wrap gap-1.5">
                {GENRES.map((genre) => (
                  <Button
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleGenre(genre.id)}
                    className={cn(
                      "h-7 rounded-full px-3 text-xs transition-colors",
                      selectedGenres.includes(genre.id)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted"
                    )}
                  >
                    {genre.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">Moods</h3>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((mood) => (
                  <Button
                    key={mood.id}
                    variant={selectedMoods.includes(mood.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMood(mood.id)}
                    className={cn(
                      "h-7 rounded-full px-3 text-xs transition-colors",
                      selectedMoods.includes(mood.id)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted"
                    )}
                  >
                    {mood.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground">BPM Range</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <input
                    id="bpmMin"
                    type="number"
                    value={bpmMin}
                    onChange={(e) => setBpmMin(e.target.value)}
                    min="0"
                    max="999"
                    placeholder="Min BPM"
                    className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <input
                    id="bpmMax"
                    type="number"
                    value={bpmMax}
                    onChange={(e) => setBpmMax(e.target.value)}
                    min="0"
                    max="999"
                    placeholder="Max BPM"
                    className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredTracks?.map((track) => (
          <TrackCard
            key={track.id}
            track={{
              id: track.id,
              title: track.title,
              description: track.description,
              audioUrl: track.audioUrl,
              coverUrl: track.coverUrl,
              bpm: track.bpm,
              duration: track.duration,
              genres: track.genres,
              moods: track.moods,
              createdAt: track.createdAt,
              userId: track.userId,
              artist: {
                id: track.artist.id,
                name: track.artist.name ?? "Unknown Artist",
                image: track.artist.image,
              },
              url: track.audioUrl,
            }}
          />
        ))}
      </div>
    </div>
  );
}