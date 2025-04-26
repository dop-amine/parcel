import { create } from "zustand";

interface Track {
  id: string;
  title: string;
  artist: {
    id: string;
    name: string | null;
    image: string | null;
  };
  coverUrl: string | null;
  audioUrl: string;
  bpm: number | null;
  genres: string[];
  moods: string[];
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isMinimized: boolean;
  setTrack: (track: Track | null) => void;
  togglePlay: () => void;
  setPlaying: (state: boolean) => void;
  setMinimized: (state: boolean) => void;
  toggleMinimized: () => void;
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  currentTrack: null,
  isPlaying: false,
  isMinimized: false,
  setTrack: (track) => set({ currentTrack: track }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (state) => set({ isPlaying: state }),
  setMinimized: (state) => set({ isMinimized: state }),
  toggleMinimized: () => set((state) => ({ isMinimized: !state.isMinimized })),
}));