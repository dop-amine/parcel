'use client';

import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Suspense } from 'react';
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  MEDIA_TYPES,
  LICENSE_TYPES,
  ROYALTY_COLLECTION_ENTITIES,
  DISALLOWED_USES,
  ENTITY_TYPES,
  PUBLISHER_TYPES,
  SONGWRITER_ROLES,
  PERFORMING_RIGHTS_ORGS,
  getMediaTypeCategory
} from '@/constants/music';
import { useState } from 'react';

interface TrackType {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  coverUrl: string | null;
  bpm: number | null;
  duration: number;
  genres: string[];
  moods: string[];
  createdAt: string | Date;
  _count: { plays: number; purchases: number };
  user: { id: string; name: string | null; profilePicture: string | null };
  // Basic Song Info
  isrcCode: string | null;
  iswcCode: string | null;
  // Ownership & Rights
  ownsFullRights: boolean;
  masterOwners: any; // JSON array
  publishingOwners: any; // JSON array
  songwriters: any; // JSON array
  // Sync Licensing Preferences
  minimumSyncFee: number | null;
  allowedMediaTypes: string[];
  licenseType: string | null;
  canBeModified: boolean;
  disallowedUses: string | null;
  // Revenue & Payment Info
  royaltyCollectionEntity: string | null;
  splitConfirmation: boolean;
  basePrice: number | null;
  isNegotiable: boolean;
  // New pricing structure
  trackPricing: Array<{
    id: string;
    mediaTypeId: string;
    mediaTypeCategory: string;
    basePrice: number;
    buyoutPrice: number | null;
    hasInstantBuy: boolean;
    lowestPrice: number;
  }>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );
}

function TracksList() {
  const { data: tracks, isLoading, refetch } = api.track.getMyTracks.useQuery();
  const deleteTrack = api.track["delete"].useMutation({
    onSuccess: () => refetch(),
  }) as any;
  const { currentTrack, isPlaying, setTrack, togglePlay, setPlaying } = usePlayerStore();
  const [openTrack, setOpenTrack] = useState<TrackType | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<TrackType | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (tracks?.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-white mb-4">No tracks uploaded yet</h2>
        <Link
          href="/artist/upload"
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Upload your first track
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks?.map((track) => {
          const t = { ...track } as TrackType;
          const isCurrentTrack = currentTrack?.id === t.id;
          const trackWithArtist = {
            ...t,
            artist: t.user,
          };
          return (
            <div
              key={t.id}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-all"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white">{t.title}</h3>
                  <button
                    onClick={() => {
                      if (isCurrentTrack) {
                        togglePlay();
                      } else {
                        setTrack(trackWithArtist);
                        setPlaying(true);
                      }
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
                  >
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </button>
                </div>
                {t.description && (
                  <p className="text-gray-400 mb-4 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {t.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-purple-900/50 text-purple-200 text-sm px-2 py-1 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</span>
                  <span>{Math.floor(t.duration / 60)}:{String(Math.floor(t.duration % 60)).padStart(2, '0')}</span>
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-300">Plays: {t._count.plays}</p>
                  <p className="text-sm font-medium text-gray-300">Purchases: {t._count.purchases}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                    onClick={() => setOpenTrack(t)}
                  >
                    View Details
                  </button>
                  <button
                    className="text-red-400 hover:text-red-300 transition-colors text-sm"
                    onClick={() => {
                      setDeletingTrack(t);
                      setIsConfirmOpen(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingTrack?.title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <button
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </button>
            </DialogClose>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                if (deletingTrack) {
                  await deleteTrack.mutateAsync({ id: deletingTrack.id });
                  setIsConfirmOpen(false);
                  setDeletingTrack(null);
                }
              }}
              disabled={deleteTrack.isLoading}
            >
              {deleteTrack.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!openTrack} onOpenChange={(open) => !open && setOpenTrack(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          {openTrack && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  {openTrack.title}
                  {openTrack.ownsFullRights && (
                    <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-600/30">
                      One-Stop Cleared
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Uploaded {formatDistanceToNow(new Date(openTrack.createdAt), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

                {/* LEFT COLUMN */}
                <div className="space-y-6">

                  {/* Basic Information */}
                  <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      {openTrack.description && (
                        <div>
                          <p className="text-sm text-gray-400">Description</p>
                          <p className="text-gray-300">{openTrack.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">BPM</p>
                          <p className="text-gray-300">{openTrack.bpm || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Duration</p>
                          <p className="text-gray-300">{Math.floor(openTrack.duration / 60)}:{String(Math.floor(openTrack.duration % 60)).padStart(2, '0')}</p>
                        </div>
                      </div>

                      {(openTrack.isrcCode || openTrack.iswcCode) && (
                        <div className="grid grid-cols-2 gap-4">
                          {openTrack.isrcCode && (
                            <div>
                              <p className="text-sm text-gray-400">ISRC Code</p>
                              <p className="text-gray-300 font-mono text-sm">{openTrack.isrcCode}</p>
                            </div>
                          )}
                          {openTrack.iswcCode && (
                            <div>
                              <p className="text-sm text-gray-400">ISWC Code</p>
                              <p className="text-gray-300 font-mono text-sm">{openTrack.iswcCode}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Genres</p>
                        <div className="flex flex-wrap gap-2">
                          {openTrack.genres.map((genre) => (
                            <Badge key={genre} className="bg-purple-900/50 text-purple-200 border-purple-700">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Moods</p>
                        <div className="flex flex-wrap gap-2">
                          {openTrack.moods.map((mood) => (
                            <Badge key={mood} className="bg-blue-900/50 text-blue-200 border-blue-700">
                              {mood}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ownership & Rights */}
                  <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                      Ownership & Rights
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400">Full Rights Ownership</p>
                        <p className="text-gray-300 font-medium">
                          {openTrack.ownsFullRights
                            ? 'Yes - I own 100% of Master and Publishing rights'
                            : 'No - Split ownership'
                          }
                        </p>
                      </div>

                      {!openTrack.ownsFullRights && (
                        <>
                          {openTrack.masterOwners && Array.isArray(openTrack.masterOwners) && openTrack.masterOwners.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-400 mb-2 font-medium">Master Rights Co-Owners</p>
                              <div className="space-y-2">
                                {openTrack.masterOwners.map((owner: any, index: number) => (
                                  <div key={index} className="bg-gray-800/50 border border-gray-700 rounded p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-gray-300 font-medium">{owner.name}</p>
                                        <p className="text-gray-400 text-sm">{owner.email}</p>
                                        {owner.entityType && (
                                          <p className="text-gray-500 text-xs mt-1">
                                            {ENTITY_TYPES.find(et => et.id === owner.entityType)?.label}
                                          </p>
                                        )}
                                      </div>
                                      <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded text-sm font-medium">
                                        {owner.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {openTrack.publishingOwners && Array.isArray(openTrack.publishingOwners) && openTrack.publishingOwners.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-400 mb-2 font-medium">Publishing Rights Co-Owners</p>
                              <div className="space-y-2">
                                {openTrack.publishingOwners.map((owner: any, index: number) => (
                                  <div key={index} className="bg-gray-800/50 border border-gray-700 rounded p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-gray-300 font-medium">{owner.publisherName || owner.name}</p>
                                        <p className="text-gray-400 text-sm">{owner.contactEmail || owner.email}</p>
                                        {owner.publisherType && (
                                          <p className="text-gray-500 text-xs mt-1">
                                            {PUBLISHER_TYPES.find(pt => pt.id === owner.publisherType)?.label}
                                          </p>
                                        )}
                                        {owner.proAffiliation && (
                                          <p className="text-gray-500 text-xs">
                                            PRO: {PERFORMING_RIGHTS_ORGS.find(pro => pro.id === owner.proAffiliation)?.label}
                                          </p>
                                        )}
                                      </div>
                                      <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm font-medium">
                                        {owner.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {openTrack.songwriters && Array.isArray(openTrack.songwriters) && openTrack.songwriters.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-400 mb-2 font-medium">Songwriters</p>
                              <div className="space-y-2">
                                {openTrack.songwriters.map((songwriter: any, index: number) => (
                                  <div key={index} className="bg-gray-800/50 border border-gray-700 rounded p-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-gray-300 font-medium">{songwriter.name}</p>
                                        <p className="text-gray-400 text-sm">{songwriter.email}</p>
                                        {songwriter.role && (
                                          <p className="text-gray-500 text-xs mt-1">
                                            {SONGWRITER_ROLES.find(sr => sr.id === songwriter.role)?.label}
                                          </p>
                                        )}
                                        {songwriter.proAffiliation && (
                                          <p className="text-gray-500 text-xs">
                                            PRO: {PERFORMING_RIGHTS_ORGS.find(pro => pro.id === songwriter.proAffiliation)?.label}
                                          </p>
                                        )}
                                      </div>
                                      {songwriter.writingSharePercentage && (
                                        <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-sm font-medium">
                                          {songwriter.writingSharePercentage}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                  {/* Sync Licensing & Pricing */}
                  <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                      Sync Licensing & Pricing
                    </h3>
                    <div className="space-y-4">

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">License Type</p>
                          <p className="text-gray-300 capitalize font-medium">
                            {openTrack.licenseType
                              ? LICENSE_TYPES.find(type => type.id === openTrack.licenseType)?.label || openTrack.licenseType
                              : 'Not specified'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Can Be Modified</p>
                          <p className="text-gray-300 font-medium">{openTrack.canBeModified ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {/* Updated Media Types & Pricing Section */}
                      {openTrack.trackPricing && openTrack.trackPricing.length > 0 ? (
                        <div>
                          <p className="text-sm text-gray-400 mb-3 font-medium">Usage Types & Pricing</p>
                          <div className="space-y-3">
                            {openTrack.trackPricing.map((pricing) => {
                              const mediaType = MEDIA_TYPES.find(mt => mt.id === pricing.mediaTypeId);

                              return (
                                <div key={pricing.id} className="bg-gray-800/50 border border-gray-700 rounded p-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-300 font-medium">{mediaType?.label}</span>
                                    {pricing.hasInstantBuy && (
                                      <span className="text-xs text-green-400 bg-green-600/20 border border-green-600/30 px-2 py-1 rounded">
                                        One-Click Available
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-400">Base Price:</span>
                                      <span className="text-gray-300 font-medium">${pricing.basePrice.toLocaleString()}</span>
                                    </div>

                                    {pricing.buyoutPrice && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Buyout Price:</span>
                                        <span className="text-green-400 font-medium">${pricing.buyoutPrice.toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : openTrack.allowedMediaTypes && openTrack.allowedMediaTypes.length > 0 ? (
                        <div>
                          <p className="text-sm text-gray-400 mb-3 font-medium">Allowed Media Types</p>
                          <div className="space-y-3">
                            {openTrack.allowedMediaTypes.map((mediaTypeId) => {
                              const mediaType = MEDIA_TYPES.find(mt => mt.id === mediaTypeId);
                              const category = getMediaTypeCategory(mediaTypeId);

                              return (
                                <div key={mediaTypeId} className="bg-gray-800/50 border border-gray-700 rounded p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-300 font-medium">{mediaType?.label}</span>
                                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                                      {category === 'traditional' ? 'Contact for pricing' : 'Contact for pricing'}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    Pricing available upon request
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <p>No pricing information available</p>
                          <p className="text-xs mt-1">Upload a new track to set detailed pricing</p>
                        </div>
                      )}

                      {openTrack.disallowedUses && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2 font-medium">Disallowed Uses</p>
                          <div className="flex flex-wrap gap-2">
                            {openTrack.disallowedUses.split(',').map((use: string, index: number) => (
                              <Badge key={index} className="bg-red-900/30 text-red-300 border-red-700">
                                {DISALLOWED_USES.find(du => du.id === use.trim())?.label || use.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="bg-gray-900/50 rounded-lg p-5 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                      Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400">{openTrack._count.plays}</div>
                        <p className="text-sm text-gray-400">Total Plays</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-400">{openTrack._count.purchases}</div>
                        <p className="text-sm text-gray-400">Purchases</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ArtistTracks() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to view your tracks</h1>
          <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'ARTIST') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Only artists can view tracks</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">My Tracks</h1>
        <Link
          href="/artist/upload"
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
        >
          Upload New Track
        </Link>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <TracksList />
      </Suspense>
    </div>
  );
}