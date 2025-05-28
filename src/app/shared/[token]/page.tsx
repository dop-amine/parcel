'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  DollarSign,
  Clock,
  Music,
  Users,
  ExternalLink,
  Send,
  Download,
  Heart,
  Share2
} from "lucide-react";

export default function SharedPlaylistPage() {
  const params = useParams();
  const token = params?.token as string;
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [dealForm, setDealForm] = useState({
    execName: '',
    execEmail: '',
    company: '',
    usageType: 'SYNC' as 'SYNC' | 'MASTER',
    rights: 'NON_EXCLUSIVE' as 'EXCLUSIVE' | 'NON_EXCLUSIVE',
    duration: 12,
    price: 1000,
    message: ''
  });

  // API calls
  const { data: playlistData, isLoading, error } = api.shared.getSharedPlaylist.useQuery(
    { token },
    { enabled: !!token }
  );
  const submitDealMutation = api.shared.submitExternalDealOffer.useMutation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !playlistData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Playlist Not Found</h1>
          <p className="text-gray-400">This playlist may have been removed or the link has expired.</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (trackId: string) => {
    if (isPlaying === trackId) {
      setIsPlaying(null);
    } else {
      setIsPlaying(trackId);
    }
  };

  const handleMakeOffer = (track: any) => {
    setSelectedTrack(track);
    setDealForm(prev => ({
      ...prev,
      price: track.track.basePrice || 1000
    }));
    setIsDealModalOpen(true);
  };

  const submitDeal = async () => {
    if (!selectedTrack || !token) return;

    try {
      await submitDealMutation.mutateAsync({
        shareToken: token,
        trackId: selectedTrack.track.id,
        ...dealForm
      });
      setIsDealModalOpen(false);
      setSelectedTrack(null);
      alert('Deal offer submitted successfully! The artist and representative will be notified.');
    } catch (error) {
      console.error('Failed to submit deal:', error);
      alert('Failed to submit deal offer. Please try again.');
    }
  };

  const playlist = playlistData.playlist;
  const rep = playlistData.rep;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gray-800">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{playlist.name}</h1>
                  <p className="text-gray-300">Curated by {rep?.name || playlist.user.name}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-4 max-w-2xl">{playlist.description}</p>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span>{playlist.tracks.length} tracks</span>
                <span>Shared {new Date(playlistData.createdAt).toLocaleDateString()}</span>
                {playlistData.viewedAt && (
                  <span>Last viewed {new Date(playlistData.viewedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 mb-2">
                Parcel Music Licensing
              </Badge>
              <div className="text-sm text-gray-400">
                <p>Contact: {rep?.email || playlist.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Track List */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Tracks Available for Licensing</h2>
          <p className="text-gray-400">Click play to preview tracks, then make an offer for licensing rights.</p>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {playlist.tracks.map((playlistTrack, index) => {
              const track = playlistTrack.track;
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* Play Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlay(track.id)}
                          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isPlaying === track.id ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                          )}
                        </Button>

                        {/* Track Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{track.title}</h3>
                          <p className="text-gray-400 mb-2">{track.user.name}</p>

                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-sm text-gray-500">{formatDuration(track.duration)}</span>
                            {track.bpm && <span className="text-sm text-gray-500">{track.bpm} BPM</span>}
                            <div className="flex gap-1">
                              {track.genres.slice(0, 2).map(genre => (
                                <Badge key={genre} variant="outline" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {track.moods.slice(0, 3).map(mood => (
                              <Badge key={mood} variant="outline" className="text-xs bg-blue-500/10 text-blue-400">
                                {mood}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400 mb-2">
                            ${(track.basePrice || 1000).toLocaleString()}
                          </div>
                          <Button
                            onClick={() => handleMakeOffer(playlistTrack)}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={submitDealMutation.isPending}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Make Offer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">Licensing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <p>• All tracks are available for sync and master licensing</p>
              <p>• Prices shown are starting points for negotiation</p>
              <p>• Multiple usage rights available (exclusive/non-exclusive)</p>
              <p>• Quick turnaround on licensing agreements</p>
              <p>• Full stems and alternate versions available</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-white">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <p>1. Preview tracks by clicking the play button</p>
              <p>2. Click "Make Offer" to submit licensing terms</p>
              <p>3. Our team will contact you within 24 hours</p>
              <p>4. Negotiate terms directly with the artist</p>
              <p>5. Receive licensed tracks and documentation</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deal Modal */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Make Licensing Offer</DialogTitle>
            <p className="text-gray-400">
              Submit your offer for "{selectedTrack?.track.title}" by {selectedTrack?.track.user.name}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Your Name</label>
              <Input
                value={dealForm.execName}
                onChange={(e) => setDealForm(prev => ({ ...prev, execName: e.target.value }))}
                placeholder="John Smith"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Email</label>
              <Input
                type="email"
                value={dealForm.execEmail}
                onChange={(e) => setDealForm(prev => ({ ...prev, execEmail: e.target.value }))}
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-300">Company</label>
              <Input
                value={dealForm.company}
                onChange={(e) => setDealForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Usage Type</label>
              <select
                value={dealForm.usageType}
                onChange={(e) => setDealForm(prev => ({ ...prev, usageType: e.target.value as any }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="SYNC">Sync License</option>
                <option value="MASTER">Master License</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Rights</label>
              <select
                value={dealForm.rights}
                onChange={(e) => setDealForm(prev => ({ ...prev, rights: e.target.value as any }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="NON_EXCLUSIVE">Non-Exclusive</option>
                <option value="EXCLUSIVE">Exclusive</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Duration (months)</label>
              <Input
                type="number"
                value={dealForm.duration}
                onChange={(e) => setDealForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Offer Amount ($)</label>
              <Input
                type="number"
                value={dealForm.price}
                onChange={(e) => setDealForm(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                min="100"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-300">Message (Optional)</label>
              <textarea
                value={dealForm.message}
                onChange={(e) => setDealForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Additional details about your project or usage..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={submitDeal}
              disabled={!dealForm.execName || !dealForm.execEmail || submitDealMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitDealMutation.isPending ? "Submitting..." : "Submit Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}