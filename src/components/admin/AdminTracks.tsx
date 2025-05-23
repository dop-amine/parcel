"use client";

import { useState } from 'react';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Flag,
  Play,
  Pause
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePlayerStore } from "@/stores/playerStore";

export default function AdminTracks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  const { currentTrack, isPlaying, setTrack, togglePlay, setPlaying } = usePlayerStore();

  // Track management state
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editNegotiable, setEditNegotiable] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  // Get all tracks with admin access
  const { data: tracksData, isLoading, refetch } = api.track.getAllPublic.useQuery({
    page: 1,
    limit: 100,
  });

  // Admin track mutations
  const updateTrack = api.track.update.useMutation({
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    },
  });

  const deleteTrack = api.track.delete.useMutation({
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      setSelectedTrack(null);
      refetch();
    },
  });

  const tracks = tracksData?.tracks || [];

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === 'all' || track.genres.includes(genreFilter);

    return matchesSearch && matchesGenre;
  });

  const handleEditTrack = (track: any) => {
    setSelectedTrack(track);
    setEditTitle(track.title);
    setEditPrice('');
    setEditNegotiable(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteTrack = (track: any) => {
    setSelectedTrack(track);
    setIsDeleteModalOpen(true);
  };

  const handleFlagTrack = (track: any) => {
    setSelectedTrack(track);
    setFlagReason('');
    setIsFlagModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tracks or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="hip-hop">Hip Hop</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{tracks.length}</div>
          <div className="text-gray-400 text-sm">Total Tracks</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{new Set(tracks.map(t => t.user?.id)).size}</div>
          <div className="text-gray-400 text-sm">Active Artists</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-gray-400 text-sm">Flagged Content</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-gray-400 text-sm">Reports Pending</div>
        </div>
      </div>

      {/* Tracks Table */}
      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Track</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Artist</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Genre</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Uploaded</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks?.map((track) => (
                <tr key={track.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          if (currentTrack?.id === track.id) {
                            togglePlay();
                          } else {
                            setTrack({ ...track, artist: track.user });
                            setPlaying(true);
                          }
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <div>
                        <div className="font-medium text-white">{track.title}</div>
                        <div className="text-sm text-gray-400">{track.bpm || 0} BPM</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-300">{track.user?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {track.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} variant="outline" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {track.genres.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{track.genres.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-400">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(track.createdAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTrack(track)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlagTrack(track)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteTrack(track)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Track Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Modify track details and metadata</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!selectedTrack) return;
            updateTrack.mutate({
              id: selectedTrack.id,
              title: editTitle,
              basePrice: editPrice ? parseFloat(editPrice) : undefined,
              isNegotiable: editNegotiable,
            });
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Leave empty for no price"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editNegotiable"
                  checked={editNegotiable}
                  onChange={(e) => setEditNegotiable(e.target.checked)}
                />
                <label htmlFor="editNegotiable" className="text-sm font-medium text-gray-300">
                  Price is negotiable
                </label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateTrack.isPending}>
                {updateTrack.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Flag Track Modal */}
      <Dialog open={isFlagModalOpen} onOpenChange={setIsFlagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Track</DialogTitle>
            <DialogDescription>
              Flag this track for content review. Provide a reason for flagging.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log('Flagging track:', selectedTrack?.id, 'Reason:', flagReason);
            setIsFlagModalOpen(false);
          }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Reason</label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate-content">Inappropriate Content</option>
                  <option value="copyright-violation">Copyright Violation</option>
                  <option value="spam">Spam</option>
                  <option value="misleading-info">Misleading Information</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                Flag Track
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Track Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">"{selectedTrack?.title}"</span>?
              This action cannot be undone and will remove the track from all playlists and purchases.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedTrack) {
                  deleteTrack.mutate({ id: selectedTrack.id });
                }
              }}
              disabled={deleteTrack.isPending}
            >
              {deleteTrack.isPending ? 'Deleting...' : 'Delete Track'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}