"use client";
import { api } from '@/utils/api';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import TrackCard from '@/components/TrackCard';
import { Play, Pause, Heart, ShoppingCart, Plus, Trash2 } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import PurchaseDialog from '@/components/PurchaseDialog';

export default function ExecLibrary() {
  const { data: likedTracks, isLoading: loadingLikes, refetch: refetchLikedTracks } = api.like.getLikedTracks.useQuery();
  const { data: playlists, isLoading: loadingPlaylists, refetch: refetchPlaylists } = api.playlist.getPlaylists.useQuery();
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedLiked, setSelectedLiked] = useState(false);
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
    onSuccess: (data, variables) => {
      refetchPlaylists().then((res) => {
        // If a playlist is selected, update it with the latest data
        if (selectedPlaylist && variables && variables.playlistId === selectedPlaylist.id) {
          const updated = res.data?.find((pl: any) => pl.id === selectedPlaylist.id);
          if (updated) setSelectedPlaylist(updated);
        }
      });
    },
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPlaylist, setEditPlaylist] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePlaylist, setSharePlaylist] = useState<any>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [addTrackPlaylist, setAddTrackPlaylist] = useState<any>(null);
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistCover, setPlaylistCover] = useState('');
  const [playlistPublic, setPlaylistPublic] = useState(false);
  const [shareEmails, setShareEmails] = useState('');
  const updatePlaylist = api.playlist.updatePlaylist.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      setEditPlaylist(null);
      refetchPlaylists().then((res) => {
        if (selectedPlaylist) {
          const updated = res.data?.find((pl: any) => pl.id === selectedPlaylist.id);
          if (updated) setSelectedPlaylist(updated);
        }
      });
    },
  });
  const sharePlaylistMutation = api.playlist.sharePlaylist.useMutation({
    onSuccess: () => {
      setIsShareModalOpen(false);
      setSharePlaylist(null);
      setShareEmails('');
      refetchPlaylists();
    },
  });
  const addTrackToPlaylist = api.playlist.addTrackToPlaylist.useMutation({
    onSuccess: () => {
      setIsAddToPlaylistOpen(false);
      refetchPlaylists().then((res) => {
        if (selectedPlaylist) {
          const updated = res.data?.find((pl: any) => pl.id === selectedPlaylist.id);
          if (updated) setSelectedPlaylist(updated);
        }
      });
    },
  });
  const unlikeTrack = api.like.unlikeTrack.useMutation({
    onSuccess: () => {
      refetchLikedTracks();
      refetchPlaylists();
    }
  });

  // Select first playlist by default
  useEffect(() => {
    if (!selectedPlaylist && playlists && playlists.length > 0 && !selectedLiked) {
      setSelectedPlaylist(playlists[0]);
    }
  }, [playlists, selectedLiked]);

  // Sidebar click handler
  const handleSelectPlaylist = (playlist: any) => {
    setSelectedLiked(false);
    setSelectedPlaylist(playlist);
  };
  const handleSelectLiked = () => {
    setSelectedLiked(true);
    setSelectedPlaylist(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Library</h1>
        <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={() => setIsCreateModalOpen(true)}>+ New Playlist</button>
      </header>
      <div className="flex flex-1 w-full max-w-7xl mx-auto mt-6 gap-8 px-4">
        {/* Sidebar: Playlists */}
        <aside className="w-80 min-w-[220px] max-w-xs flex-shrink-0">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Playlists</h2>
            <div className="flex flex-col gap-3">
              {/* Liked Songs special item */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-gray-800 hover:bg-gray-800 transition-colors ${selectedLiked ? 'bg-purple-900/60 border-purple-500' : 'bg-gray-900'}`}
                onClick={handleSelectLiked}
              >
                <div className="h-12 w-12 rounded bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow">❤</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">Liked Songs</div>
                  <div className="text-xs text-gray-400 truncate">{likedTracks?.length ?? 0} tracks</div>
                </div>
              </div>
              {/* Playlists */}
              {(playlists ?? []).map((playlist: any) => (
                <div
                  key={playlist.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-gray-800 hover:bg-gray-800 transition-colors ${selectedPlaylist?.id === playlist.id && !selectedLiked ? 'bg-purple-900/60 border-purple-500' : 'bg-gray-900'}`}
                  onClick={() => handleSelectPlaylist(playlist)}
                >
                  {playlist.coverUrl ? (
                    <img src={playlist.coverUrl} alt="cover" className="h-12 w-12 rounded object-cover border border-gray-700" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-800 flex items-center justify-center text-gray-500 text-xl font-bold">🎵</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{playlist.name}</div>
                    <div className="text-xs text-gray-400 truncate">{playlist.tracks.length} tracks</div>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <button className="text-blue-400 hover:text-blue-300 text-xs" onClick={e => { e.stopPropagation(); setEditPlaylist(playlist); setPlaylistDesc(playlist.description || ''); setPlaylistCover(playlist.coverUrl || ''); setPlaylistPublic(playlist.isPublic); setIsEditModalOpen(true); }}>Edit</button>
                    <button className="text-green-400 hover:text-green-300 text-xs" onClick={e => { e.stopPropagation(); setSharePlaylist(playlist); setIsShareModalOpen(true); }}>Share</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
        {/* Main Area: Playlist Details or Liked Songs */}
        <main className="flex-1 flex flex-col gap-6">
          {selectedLiked ? (
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-900 p-8">
              <div className="flex items-center gap-6 mb-6 sticky top-0 z-10 bg-black/30 py-4 rounded-xl">
                <div className="h-28 w-28 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white text-5xl font-bold shadow ml-8">❤</div>
                <div className="flex-1 min-w-0">
                  <input
                    className="bg-transparent text-3xl font-extrabold text-white outline-none border-b-2 border-transparent w-full"
                    value="Liked Songs"
                    disabled
                  />
                  <div className="text-gray-300 text-base mt-2">Your favorite tracks, all in one place.</div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-white mb-4">Tracks</h4>
                {loadingLikes ? (
                  <div className="text-gray-400">Loading...</div>
                ) : likedTracks && likedTracks.length === 0 ? (
                  <div className="text-gray-400">No liked tracks yet.</div>
                ) : (
                  <ul className="space-y-3">
                    {likedTracks?.map((like: any) => (
                      <li key={like.track.id} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-4 shadow group">
                        <div className="flex items-center gap-4">
                          {like.track.user?.profilePicture ? (
                            <img src={like.track.user.profilePicture} alt="artist cover" className="h-12 w-12 rounded-full object-cover border border-gray-700" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xl">🎤</div>
                          )}
                          <div>
                            <div className="font-bold text-white text-lg">{like.track.title}</div>
                            <div className="text-xs text-gray-400">{like.track.user?.name || 'Artist'} &bull; {like.track.duration ? `${Math.round(like.track.duration)}s` : ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => {
                            if (currentTrack?.id === like.track.id) {
                              togglePlay();
                            } else {
                              setTrack({ ...like.track, artist: like.track.user });
                              setPlaying(true);
                            }
                          }} aria-label={currentTrack?.id === like.track.id && isPlaying ? "Pause" : "Play"}>
                            {currentTrack?.id === like.track.id && isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => {
                            setSelectedTrack({
                              ...like.track,
                              artist: {
                                name: like.track.user?.name || 'Unknown Artist'
                              }
                            });
                            setIsPurchaseDialogOpen(true);
                          }}>
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => {
                            setSelectedTrack({
                              ...like.track,
                              artist: {
                                name: like.track.user?.name || 'Unknown Artist'
                              }
                            });
                            setIsAddToPlaylistOpen(true);
                          }}>
                            <Plus className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-red-400 hover:bg-red-500/20 transition-colors" onClick={() => unlikeTrack.mutate({ trackId: like.track.id })} disabled={unlikeTrack.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : selectedPlaylist ? (
            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-900 p-8">
              {/* Sticky header with cover and inline editing */}
              <div className="flex items-center gap-6 mb-6 sticky top-0 z-10 bg-black/30 py-4 rounded-xl">
                {selectedPlaylist.coverUrl ? (
                  <img src={selectedPlaylist.coverUrl} alt="cover" className="h-28 w-28 rounded-xl object-cover border-4 border-purple-700 shadow-lg ml-8" />
                ) : (
                  <div className="h-28 w-28 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-3xl font-bold ml-8">🎵</div>
                )}
                <div className="flex-1 min-w-0">
                  <input
                    className="bg-transparent text-3xl font-extrabold text-white outline-none border-b-2 border-transparent focus:border-purple-500 transition w-full"
                    value={selectedPlaylist.name}
                    disabled
                  />
                  <textarea
                    className="bg-transparent text-gray-300 text-base mt-2 outline-none border-b-2 border-transparent focus:border-purple-500 transition w-full resize-none"
                    value={selectedPlaylist.description || ''}
                    disabled
                  />
                  <div className="flex items-center gap-3 mt-2">
                    {selectedPlaylist.isPublic && <span className="px-2 py-0.5 rounded bg-green-700 text-xs text-white">Public</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mr-8">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs" onClick={() => { setEditPlaylist(selectedPlaylist); setPlaylistDesc(selectedPlaylist.description || ''); setPlaylistCover(selectedPlaylist.coverUrl || ''); setPlaylistPublic(selectedPlaylist.isPublic); setIsEditModalOpen(true); }}>Edit</button>
                  <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs" onClick={() => { setSharePlaylist(selectedPlaylist); setIsShareModalOpen(true); }}>Share</button>
                </div>
              </div>
              {/* Track List */}
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-white mb-4">Tracks</h4>
                {selectedPlaylist.tracks.length === 0 ? (
                  <div className="text-gray-400">No tracks in this playlist.</div>
                ) : (
                  <ul className="space-y-3">
                    {selectedPlaylist.tracks.map((pt: any) => (
                      <li key={pt.track.id} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-4 shadow group">
                        <div className="flex items-center gap-4">
                          {pt.track.user?.profilePicture ? (
                            <img src={pt.track.user.profilePicture} alt="artist cover" className="h-12 w-12 rounded-full object-cover border border-gray-700" />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xl">🎤</div>
                          )}
                          <div>
                            <div className="font-bold text-white text-lg">{pt.track.title}</div>
                            <div className="text-xs text-gray-400">{pt.track.user?.name || 'Artist'} &bull; {pt.track.duration ? `${Math.round(pt.track.duration)}s` : ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => {
                            if (currentTrack?.id === pt.track.id) {
                              togglePlay();
                            } else {
                              setTrack({ ...pt.track, artist: pt.track.user });
                              setPlaying(true);
                            }
                          }} aria-label={currentTrack?.id === pt.track.id && isPlaying ? "Pause" : "Play"}>
                            {currentTrack?.id === pt.track.id && isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => {
                            setSelectedTrack({
                              ...pt.track,
                              artist: {
                                name: pt.track.user?.name || 'Unknown Artist'
                              }
                            });
                            setIsPurchaseDialogOpen(true);
                          }}>
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                          <button className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-red-400 hover:bg-red-500/20 transition-colors" onClick={() => removeTrackFromPlaylist.mutate({ playlistId: selectedPlaylist.id, trackId: pt.track.id })} disabled={removeTrackFromPlaylist.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedPlaylist.tracks.length > 1 && (
                  <div className="text-xs text-gray-500 mt-2">(Drag and drop to reorder coming soon)</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">Select a playlist to view details.</div>
          )}
        </main>
      </div>
      {/* Modals (Edit, Share, Add Track, Create Playlist) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>Update playlist details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            if (!editPlaylist) return;
            updatePlaylist.mutate({
              playlistId: editPlaylist.id,
              name: editPlaylist.name,
              description: playlistDesc,
              coverUrl: playlistCover,
              isPublic: playlistPublic,
            });
          }}>
            <input type="text" value={editPlaylist?.name || ''} disabled className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white" />
            <textarea value={playlistDesc} onChange={e => setPlaylistDesc(e.target.value)} className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white" placeholder="Description" />
            <input type="text" value={playlistCover} onChange={e => setPlaylistCover(e.target.value)} className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white" placeholder="Cover image URL" />
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={playlistPublic} onChange={e => setPlaylistPublic(e.target.checked)} />
              <span className="text-sm text-gray-300">Public</span>
            </label>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
              </DialogClose>
              <button type="submit" className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700" disabled={updatePlaylist.isPending}>
                {updatePlaylist.isPending ? 'Saving...' : 'Save'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Playlist</DialogTitle>
            <DialogDescription>Enter email addresses (comma separated) to share this playlist.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            if (!sharePlaylist) return;
            const emails = shareEmails.split(',').map(e => e.trim()).filter(Boolean);
            if (emails.length === 0) return;
            sharePlaylistMutation.mutate({ playlistId: sharePlaylist.id, emails });
          }}>
            <input type="text" value={shareEmails} onChange={e => setShareEmails(e.target.value)} className="w-full mb-4 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white" placeholder="Emails" />
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
              </DialogClose>
              <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" disabled={sharePlaylistMutation.isPending}>
                {sharePlaylistMutation.isPending ? 'Sharing...' : 'Share'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        track={selectedTrack}
      />
      <Dialog open={isAddToPlaylistOpen} onOpenChange={setIsAddToPlaylistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>Select a playlist to add this track to.</DialogDescription>
          </DialogHeader>
          <div className="max-h-56 overflow-y-auto mb-4 space-y-1">
            {playlists?.map((pl: any) => (
              <button
                key={pl.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
                onClick={() => {
                  if (selectedTrack) {
                    addTrackToPlaylist.mutate({ playlistId: pl.id, trackId: selectedTrack.id });
                  }
                }}
              >
                <span className="flex-1 text-left truncate">{pl.name}</span>
                <span className="text-xs text-gray-400">{pl.tracks.length} tracks</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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