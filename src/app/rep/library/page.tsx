'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
import {
  Users,
  Plus,
  Share,
  Play,
  Music,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Pause,
  Trash2,
  ShoppingCart
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

export default function RepLibrary() {
  const { data: session, status } = useSession();
  const { data: likedTracks, isLoading: loadingLikes, refetch: refetchLikedTracks } = api.like.getLikedTracks.useQuery();
  const { data: playlists, isLoading: loadingPlaylists, refetch: refetchPlaylists } = api.rep.getRepPlaylists.useQuery();
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedLiked, setSelectedLiked] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const { currentTrack, isPlaying, setTrack, togglePlay, setPlaying } = usePlayerStore();
  const [shareMessage, setShareMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealTrack, setDealTrack] = useState<any>(null);

  // Select first playlist by default
  useEffect(() => {
    if (!selectedPlaylist && playlists && playlists.length > 0 && !selectedLiked) {
      setSelectedPlaylist(playlists[0]);
    }
  }, [playlists, selectedLiked, selectedPlaylist]);

  const createPlaylist = api.playlist.createPlaylist.useMutation({
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      refetchPlaylists();
    },
  });
  const removeTrackFromPlaylist = api.playlist.removeTrackFromPlaylist.useMutation({
    onSuccess: (data, variables) => {
      refetchPlaylists().then((res) => {
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
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [playlistCover, setPlaylistCover] = useState('');
  const [playlistPublic, setPlaylistPublic] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

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
  const sharePlaylistMutation = api.rep.sharePlaylist.useMutation({
    onSuccess: () => {
      setIsShareModalOpen(false);
      setSharePlaylist(null);
      setShareEmail('');
      setShareMessage('');
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

  // TODO: Add deal creation API when available
  // const createDeal = api.deal.createDeal.useMutation({
  //   onSuccess: () => {
  //     setIsDealModalOpen(false);
  //     setDealTrack(null);
  //   },
  // });

  if (status === 'loading' || loadingPlaylists) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-950">
        <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-orange-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Library</h1>
          </div>
          <Badge variant="secondary" className="bg-orange-900/50 text-orange-400 border-orange-500/50">
            <Users className="h-3 w-3 mr-1" />
            REP
          </Badge>
        </header>
        <div className="flex flex-1 w-full max-w-7xl mx-auto mt-6 gap-8 px-4">
          <aside className="w-80 min-w-[220px] max-w-xs flex-shrink-0">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </aside>
          <main className="flex-1">
            <Skeleton className="h-64 rounded-lg" />
          </main>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'REP') {
    redirect('/');
  }

  // Sidebar click handler
  const handleSelectPlaylist = (playlist: any) => {
    setSelectedLiked(false);
    setSelectedPlaylist(playlist);
  };
  const handleSelectLiked = () => {
    setSelectedLiked(true);
    setSelectedPlaylist(null);
  };

  const copyShareLink = (playlistId: string) => {
    const shareLink = `${window.location.origin}/shared/playlist-${playlistId}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getShareStatusColor = (status: string) => {
    switch (status) {
      case 'VIEWED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DEAL_CREATED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Header */}
      <header className="w-full px-8 py-6 flex items-center justify-between border-b border-gray-800 bg-black/60 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-orange-400" />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Library</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-orange-900/50 text-orange-400 border-orange-500/50">
            <Users className="h-3 w-3 mr-1" />
            REP
          </Badge>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700" onClick={() => setIsCreateModalOpen(true)}>+ New Playlist</button>
        </div>
      </header>

      {/* REP Tools Info Banner */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-4">
        <div className="p-4 rounded-lg bg-orange-900/20 border border-orange-500/30">
          <h3 className="text-sm font-semibold text-orange-400 mb-2">Representative Playlist Tools</h3>
          <div className="flex items-center gap-6 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Share className="h-3 w-3" />
              <span>Share playlists with external execs</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span>Track engagement and responses</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3 w-3" />
              <span>Generate public links for easy access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 w-full max-w-7xl mx-auto mt-6 gap-8 px-4">
        {/* Sidebar: Playlists */}
        <aside className="w-80 min-w-[220px] max-w-xs flex-shrink-0">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Playlists</h2>
            <div className="flex flex-col gap-3">
              {/* Liked Songs special item */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-gray-800 hover:bg-gray-800 transition-colors ${selectedLiked ? 'bg-orange-900/60 border-orange-500' : 'bg-gray-900'}`}
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
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-gray-800 hover:bg-gray-800 transition-colors ${selectedPlaylist?.id === playlist.id && !selectedLiked ? 'bg-orange-900/60 border-orange-500' : 'bg-gray-900'}`}
                  onClick={() => handleSelectPlaylist(playlist)}
                >
                  {playlist.coverUrl ? (
                    <img src={playlist.coverUrl} alt="cover" className="h-12 w-12 rounded object-cover border border-gray-700" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-gray-800 flex items-center justify-center text-gray-500 text-xl font-bold">🎵</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{playlist.name}</div>
                    <div className="text-xs text-gray-400 truncate">{playlist._count?.tracks || 0} tracks</div>
                    {playlist.shares && playlist.shares.length > 0 && (
                      <div className="text-xs text-orange-400 truncate">{playlist.shares.length} shares</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <button className="text-blue-400 hover:text-blue-300 text-xs" onClick={e => { e.stopPropagation(); setEditPlaylist(playlist); setPlaylistDesc(playlist.description || ''); setPlaylistCover(playlist.coverUrl || ''); setPlaylistPublic(playlist.isPublic); setIsEditModalOpen(true); }}>Edit</button>
                    <button className="text-orange-400 hover:text-orange-300 text-xs" onClick={e => { e.stopPropagation(); setSharePlaylist(playlist); setIsShareModalOpen(true); }}>Share</button>
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
                            setDealTrack({
                              ...like.track,
                              artist: {
                                name: like.track.user?.name || 'Unknown Artist'
                              }
                            });
                            setIsDealModalOpen(true);
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
                  <img src={selectedPlaylist.coverUrl} alt="cover" className="h-28 w-28 rounded-xl object-cover border-4 border-orange-700 shadow-lg ml-8" />
                ) : (
                  <div className="h-28 w-28 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 text-3xl font-bold ml-8">🎵</div>
                )}
                <div className="flex-1 min-w-0">
                  <input
                    className="bg-transparent text-3xl font-extrabold text-white outline-none border-b-2 border-transparent focus:border-orange-500 transition w-full"
                    value={selectedPlaylist.name}
                    disabled
                  />
                  <textarea
                    className="bg-transparent text-gray-300 text-base mt-2 outline-none border-b-2 border-transparent focus:border-orange-500 transition w-full resize-none"
                    value={selectedPlaylist.description || ''}
                    disabled
                  />
                  <div className="flex items-center gap-3 mt-2">
                    {selectedPlaylist.isPublic && <span className="px-2 py-0.5 rounded bg-green-700 text-xs text-white">Public</span>}
                    {selectedPlaylist.shares && selectedPlaylist.shares.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-orange-700 text-xs text-white">{selectedPlaylist.shares.length} shares</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mr-8">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs" onClick={() => { setEditPlaylist(selectedPlaylist); setPlaylistDesc(selectedPlaylist.description || ''); setPlaylistCover(selectedPlaylist.coverUrl || ''); setPlaylistPublic(selectedPlaylist.isPublic); setIsEditModalOpen(true); }}>Edit</button>
                  <button className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 text-xs" onClick={() => { setSharePlaylist(selectedPlaylist); setIsShareModalOpen(true); }}>Share</button>
                  <button className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-xs" onClick={() => copyShareLink(selectedPlaylist.id)}>
                    {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Shares Section */}
              {selectedPlaylist.shares && selectedPlaylist.shares.length > 0 && (
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-orange-400 mb-3">Recent Shares</h4>
                  <div className="space-y-2">
                    {selectedPlaylist.shares.slice(0, 3).map((share: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 truncate">{share.email}</span>
                        <Badge variant="outline" className={getShareStatusColor(share.status)}>
                          {share.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                    {selectedPlaylist.shares.length > 3 && (
                      <div className="text-xs text-gray-400">+{selectedPlaylist.shares.length - 3} more shares</div>
                    )}
                  </div>
                </div>
              )}

              {/* Track List */}
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-white mb-4">Tracks</h4>
                {selectedPlaylist.tracks?.length === 0 ? (
                  <div className="text-gray-400">No tracks in this playlist.</div>
                ) : (
                  <ul className="space-y-3">
                    {selectedPlaylist.tracks?.map((pt: any) => (
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
                            setDealTrack({
                              ...pt.track,
                              artist: {
                                name: pt.track.user?.name || 'Unknown Artist'
                              }
                            });
                            setIsDealModalOpen(true);
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
                {selectedPlaylist.tracks?.length > 1 && (
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
              <button type="submit" className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700" disabled={updatePlaylist.isPending}>
                {updatePlaylist.isPending ? 'Saving...' : 'Save'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Playlist with Executive</DialogTitle>
            <DialogDescription>Send a secure link to an executive for music licensing opportunities.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            if (!sharePlaylist || !shareEmail.trim()) return;
            sharePlaylistMutation.mutate({
              playlistId: sharePlaylist.id,
              email: shareEmail,
              message: shareMessage,
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Executive Email</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
                  placeholder="exec@musiccompany.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Message (Optional)</label>
                <textarea
                  value={shareMessage}
                  onChange={e => setShareMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white resize-none"
                  placeholder="Hi! I've curated this playlist specifically for your upcoming project..."
                  rows={3}
                />
              </div>
              <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
                <p className="text-xs text-orange-300">
                  This will send an email with a secure link to view the playlist. The executive can stream tracks and submit licensing requests directly.
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
              </DialogClose>
              <button type="submit" className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700" disabled={sharePlaylistMutation.isPending}>
                <Mail className="h-4 w-4 mr-2" />
                {sharePlaylistMutation.isPending ? 'Sending...' : 'Send Share Link'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <span className="text-xs text-gray-400">{pl._count?.tracks || 0} tracks</span>
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
            <DialogDescription>Give your playlist a name and description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            createPlaylist.mutate({
              name: newPlaylistName,
              description: newPlaylistDescription
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Playlist Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
                  placeholder="e.g. Electronic Hits 2024"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Description</label>
                <input
                  type="text"
                  value={newPlaylistDescription}
                  onChange={e => setNewPlaylistDescription(e.target.value)}
                  className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
                  placeholder="Brief description for potential licensors"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
              </DialogClose>
              <button type="submit" className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700" disabled={createPlaylist.isPending}>
                {createPlaylist.isPending ? 'Creating...' : 'Create'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deal Creation Modal */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Deal Request</DialogTitle>
            <DialogDescription>Submit a licensing request for this track.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dealTrack && (
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {dealTrack.user?.profilePicture ? (
                    <img src={dealTrack.user.profilePicture} alt="artist" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">🎤</div>
                  )}
                  <div>
                    <div className="font-bold text-white">{dealTrack.title}</div>
                    <div className="text-sm text-gray-400">{dealTrack.artist?.name || 'Unknown Artist'}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-500/30">
              <p className="text-xs text-orange-300">
                This will create a licensing request that will be sent to the artist. You'll be able to negotiate terms and pricing directly through the platform.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button type="button" className="px-4 py-2 rounded bg-gray-700 text-white mr-2">Cancel</button>
            </DialogClose>
            <button
              type="button"
              className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => {
                // TODO: Implement deal creation when API is available
                // createDeal.mutate({ trackId: dealTrack.id });
                setIsDealModalOpen(false);
                setDealTrack(null);
                // For now, just close the modal
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Deal Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}