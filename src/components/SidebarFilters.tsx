import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENRES, MOODS } from "@/constants/music";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarFiltersProps {
  selectedGenres: string[];
  selectedMoods: string[];
  bpmMin: string;
  bpmMax: string;
  searchQuery: string;
  onUpdate: (updates: {
    selectedGenres?: string[];
    selectedMoods?: string[];
    bpmMin?: string;
    bpmMax?: string;
    searchQuery?: string;
  }) => void;
  onClear: () => void;
}

export default function SidebarFilters({
  selectedGenres,
  selectedMoods,
  bpmMin,
  bpmMax,
  searchQuery,
  onUpdate,
  onClear,
}: SidebarFiltersProps) {
  const toggleGenre = (genreId: string) => {
    onUpdate({
      selectedGenres: selectedGenres.includes(genreId)
        ? selectedGenres.filter((id) => id !== genreId)
        : [...selectedGenres, genreId],
    });
  };

  const toggleMood = (moodId: string) => {
    onUpdate({
      selectedMoods: selectedMoods.includes(moodId)
        ? selectedMoods.filter((id) => id !== moodId)
        : [...selectedMoods, moodId],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-24 h-fit rounded-lg border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm shadow-lg"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-gray-400 hover:text-white"
        >
          <X className="mr-2 h-4 w-4" />
          Clear all
        </Button>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => onUpdate({ searchQuery: e.target.value })}
            className="w-full rounded-lg border border-gray-800 bg-gray-900/50 py-2 pl-10 pr-4 text-white placeholder-gray-400 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-400">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Button
                key={genre.id}
                variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleGenre(genre.id)}
                className={cn(
                  "rounded-full",
                  selectedGenres.includes(genre.id)
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800/50"
                )}
              >
                {genre.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-400">Moods</h3>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <Button
                key={mood.id}
                variant={selectedMoods.includes(mood.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMood(mood.id)}
                className={cn(
                  "rounded-full",
                  selectedMoods.includes(mood.id)
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800/50"
                )}
              >
                {mood.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-400">BPM Range</h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={bpmMin}
              onChange={(e) => onUpdate({ bpmMin: e.target.value })}
              className="w-24 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <Input
              type="number"
              placeholder="Max"
              value={bpmMax}
              onChange={(e) => onUpdate({ bpmMax: e.target.value })}
              className="w-24 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}