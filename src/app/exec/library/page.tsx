"use client";
import { api } from '@/utils/api';
import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import TrackCard from '@/components/TrackCard';
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

export default function ExecLibrary() {
  const { data: likedTracks, isLoading: loadingLikes } = api.like.getLikedTracks.useQuery();
  const { data: playlists, isLoading: loadingPlaylists, refetch: refetchPlaylists } = api.playlist.getPlaylists.useQuery();
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { currentTrack, isPlaying, setTrack, togglePlay, setPlaying } = usePlayerStore();
  const createPlaylist = api.playlist.createPlaylist.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewPlaylistName('');
      refetchPlaylists();
    },
  });
  const removeTrackFromPlaylist = api.playlist.removeTrackFromPlaylist.useMutation({
    onSuccess: () => refetchPlaylists(),
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">Library</h1>
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-purple-300">Liked Tracks</h2>
        </div>
        {(likedTracks ?? []).length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-400">
            No liked tracks yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(likedTracks ?? []).map((like: any) => (
              <TrackCard key={like.track.id} track={{ ...like.track, artist: like.track.user }} liked={true} />
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-purple-300">Playlists</h2>
          <button className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700" onClick={() => setIsCreateModalOpen(true)}>+ New Playlist</button>
        </div>
        {(playlists ?? []).length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-400">
            No playlists yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(playlists ?? []).map((playlist: any) => (
              <div key={playlist.id} className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between cursor-pointer border border-gray-700 hover:bg-gray-700 transition-colors"
                onClick={() => setSelectedPlaylist(playlist)}>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{playlist.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{playlist.tracks.length} tracks</p>
                </div>
                <button className="mt-2 text-purple-400 hover:text-purple-300 text-sm self-end">View Tracks</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Playlist details modal (basic) */}
      {selectedPlaylist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">{selectedPlaylist.name}</h3>
            <ul className="space-y-2 mb-4">
              {selectedPlaylist.tracks.length === 0 ? (
                <li className="text-gray-400">No tracks in this playlist.</li>
              ) : (
                selectedPlaylist.tracks.map((pt: any) => (
                  <li key={pt.track.id} className="flex items-center justify-between text-gray-200 bg-gray-800 rounded p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (currentTrack?.id === pt.track.id) {
                            togglePlay();
                          } else {
                            setTrack({ ...pt.track, artist: pt.track.user });
                            setPlaying(true);
                          }
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        aria-label={currentTrack?.id === pt.track.id && isPlaying ? "Pause" : "Play"}
                      >
                        {currentTrack?.id === pt.track.id && isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>
                      <span>{pt.track.title}</span>
                    </div>
                    <button
                      className="ml-2 px-2 py-1 rounded bg-red-700 text-white text-xs hover:bg-red-800"
                      onClick={() => removeTrackFromPlaylist.mutate({ playlistId: selectedPlaylist.id, trackId: pt.track.id })}
                      disabled={removeTrackFromPlaylist.isPending}
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={() => setSelectedPlaylist(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Create Playlist Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>Give your playlist a name.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createPlaylist.mutate({ name: newPlaylistName }); }}>
            <input
              type="text"
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
              placeholder="Playlist name"
              required
            />
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
              </DialogClose>
              <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" disabled={createPlaylist.isPending}>
                {createPlaylist.isPending ? 'Creating...' : 'Create'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}