'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, ShoppingCart, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/playerStore";
import PurchaseDialog from "./PurchaseDialog";
import { api } from '@/utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface TrackCardProps {
  track: {
    id: string;
    title: string;
    artist: {
      id: string;
      name: string | null;
      image: string | null;
      profilePicture?: string;
    };
    coverUrl: string | null;
    audioUrl: string;
    bpm: number | null;
    genres: string[];
    moods: string[];
    price?: number;
    isNegotiable?: boolean;
  };
  onClickTag?: (tag: string) => void;
  liked?: boolean;
  onLikeToggle?: (liked: boolean) => void;
}

export default function TrackCard({ track, onClickTag, liked, onLikeToggle }: TrackCardProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay, setPlaying } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const likeMutation = api.like.likeTrack.useMutation();
  const unlikeMutation = api.like.unlikeTrack.useMutation();
  const [optimisticLiked, setOptimisticLiked] = useState(liked);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const { data: playlists, refetch: refetchPlaylists } = api.playlist.getPlaylists.useQuery();
  const addTrackToPlaylist = api.playlist.addTrackToPlaylist.useMutation({
    onSuccess: () => {
      setIsAddToPlaylistOpen(false);
    },
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const createPlaylist = api.playlist.createPlaylist.useMutation({
    onSuccess: (data) => {
      refetchPlaylists();
      setNewPlaylistName("");
      setSelectedPlaylistId(data.id);
    },
  });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const playlistListRef = useRef<HTMLDivElement>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    if (selectedPlaylistId && playlistListRef.current) {
      const el = playlistListRef.current.querySelector(`[data-playlist-id='${selectedPlaylistId}']`);
      if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [selectedPlaylistId, playlists]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 backdrop-blur-sm transition-transform hover:scale-[1.02]"
      >
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {track.artist?.profilePicture && (
                <img
                  src={track.artist.profilePicture}
                  alt={track.artist.name || "Artist"}
                  className="w-8 h-8 rounded-full object-cover border border-gray-700"
                />
              )}
              <div>
                <h3 className="text-sm font-medium text-white">{track.title}</h3>
                <p className="text-xs text-gray-400">{track.artist?.name || "Unknown Artist"}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isCurrentTrack) {
                  togglePlay();
                } else {
                  setTrack(track);
                  setPlaying(true);
                }
              }}
              className="h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {track.genres.map((genre) => (
              <Button
                key={genre}
                variant="outline"
                size="sm"
                onClick={() => onClickTag?.(genre)}
                className="h-6 rounded-full border-gray-800 bg-gray-900/50 px-2 text-xs text-gray-400 hover:bg-gray-800/50"
              >
                {genre}
              </Button>
            ))}
            {track.moods.map((mood) => (
              <Button
                key={mood}
                variant="outline"
                size="sm"
                onClick={() => onClickTag?.(mood)}
                className="h-6 rounded-full border-gray-800 bg-gray-900/50 px-2 text-xs text-gray-400 hover:bg-gray-800/50"
              >
                {mood}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{track.bpm || 0} BPM</span>
            <div className="flex items-center gap-2">
              {track.price !== undefined && (
                <span className="text-sm font-medium text-white">
                  ${track.price.toFixed(2)}
                  {track.isNegotiable && (
                    <span className="ml-1 text-xs text-gray-400">(Negotiable)</span>
                  )}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8 hover:text-white", (optimisticLiked ?? liked) ? "text-pink-500" : "text-gray-400")}
                  onClick={() => {
                    if (optimisticLiked ?? liked) {
                      setOptimisticLiked(false);
                      unlikeMutation.mutate({ trackId: track.id }, {
                        onSuccess: () => onLikeToggle?.(false),
                        onError: () => setOptimisticLiked(true),
                      });
                    } else {
                      setOptimisticLiked(true);
                      likeMutation.mutate({ trackId: track.id }, {
                        onSuccess: () => onLikeToggle?.(true),
                        onError: () => setOptimisticLiked(false),
                      });
                    }
                  }}
                >
                  <Heart className="h-4 w-4" fill={(optimisticLiked ?? liked) ? "#ec4899" : "none"} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPurchaseDialogOpen(true)}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddToPlaylistOpen(true)}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        track={track}
      />

      <Dialog open={isAddToPlaylistOpen} onOpenChange={setIsAddToPlaylistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
          </DialogHeader>
          {playlists && playlists.length > 0 ? (
            <>
              <div ref={playlistListRef} className="max-h-56 overflow-y-auto mb-4 space-y-1">
                {playlists.map((pl: any) => (
                  <button
                    key={pl.id}
                    data-playlist-id={pl.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${selectedPlaylistId === pl.id ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                    onClick={() => { setSelectedPlaylistId(pl.id); setAddSuccess(false); }}
                    tabIndex={0}
                  >
                    {/* No cover, just name and track count */}
                    <span className="flex-1 text-left truncate">{pl.name}</span>
                    <span className="text-xs text-gray-400">{pl.tracks.length} tracks</span>
                  </button>
                ))}
              </div>
              {!showCreate && (
                <button className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white hover:bg-purple-700 transition-colors" onClick={() => setShowCreate(true)}>
                  + Create New Playlist
                </button>
              )}
              {showCreate && (
                <form onSubmit={e => { e.preventDefault(); if (newPlaylistName) createPlaylist.mutate({ name: newPlaylistName }); }} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
                    placeholder="Playlist name"
                    required
                    autoFocus
                  />
                  <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" disabled={createPlaylist.isPending}>
                    {createPlaylist.isPending ? 'Creating...' : 'Create'}
                  </button>
                </form>
              )}
              <form onSubmit={e => {
                e.preventDefault();
                if (selectedPlaylistId) {
                  addTrackToPlaylist.mutate({ playlistId: selectedPlaylistId, trackId: track.id }, {
                    onSuccess: () => {
                      setAddSuccess(true);
                      setTimeout(() => setIsAddToPlaylistOpen(false), 1000);
                    }
                  });
                }
              }}>
                <DialogFooter>
                  <DialogClose asChild>
                    <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
                  </DialogClose>
                  <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" disabled={!selectedPlaylistId || addTrackToPlaylist.isPending}>
                    {addTrackToPlaylist.isPending ? 'Adding...' : 'Add'}
                  </button>
                </DialogFooter>
                {addSuccess && <div className="mt-2 text-green-400 text-sm">Added to playlist!</div>}
              </form>
            </>
          ) : (
            <div className="text-gray-400">No playlists found. Create one below.
              <div className="mt-4">
                <form onSubmit={e => { e.preventDefault(); if (newPlaylistName) createPlaylist.mutate({ name: newPlaylistName }); }} className="flex gap-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={e => setNewPlaylistName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
                    placeholder="Playlist name"
                    required
                    autoFocus
                  />
                  <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" disabled={createPlaylist.isPending}>
                    {createPlaylist.isPending ? 'Creating...' : 'Create'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}