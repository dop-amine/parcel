import { UserTier, ArtistTier, BuyerTier, isArtistTier, isBuyerTier } from '@/types/deal';

// Default tiers for new users
export const DEFAULT_ARTIST_TIER: ArtistTier = 'ARTIST';
export const DEFAULT_BUYER_TIER: BuyerTier = 'CREATOR';

// Upload limits per artist tier
export const UPLOAD_LIMITS = {
  ARTIST: 10,    // 10 tracks per month
  LABEL: 50,     // 50 tracks per month
  ROSTERED: -1,  // Unlimited (-1 means no limit)
} as const;

// Track visibility logic for buyers
export const getVisibleArtistTiers = (buyerTier: BuyerTier): ArtistTier[] => {
  switch (buyerTier) {
    case 'CREATOR':
    case 'STUDIO':
      return ['ARTIST', 'LABEL']; // Can see ARTIST and LABEL tier tracks
    case 'PRO':
      return ['ROSTERED']; // By default, only see ROSTERED tracks
    default:
      return ['ARTIST', 'LABEL'];
  }
};

// Check if buyer can see all tracks (Pro tier toggle)
export const canSeeAllTracks = (buyerTier: BuyerTier): boolean => {
  return buyerTier === 'PRO';
};

// Get tier display information
export const getTierInfo = (tier: UserTier) => {
  if (isArtistTier(tier)) {
    return getArtistTierInfo(tier);
  }
  return getBuyerTierInfo(tier);
};

export const getArtistTierInfo = (tier: ArtistTier) => {
  switch (tier) {
    case 'ARTIST':
      return {
        name: 'Artist',
        description: 'Independent artists, DIY musicians',
        price: '$10/month',
        color: 'purple',
        features: ['Upload tracks', 'Self-managed licensing', 'Basic analytics'],
        uploadLimit: UPLOAD_LIMITS.ARTIST,
        commission: 20, // 20% platform fee
      };
    case 'LABEL':
      return {
        name: 'Label',
        description: 'Sync ready artists looking for licensing income',
        price: '$20/month',
        color: 'blue',
        features: ['Higher upload limit', 'Manage multiple artists', 'Advanced analytics'],
        uploadLimit: UPLOAD_LIMITS.LABEL,
        commission: 10, // 10% platform fee
      };
    case 'ROSTERED':
      return {
        name: 'Rostered',
        description: 'Professional/High Quality Artists',
        price: 'Request Access',
        color: 'gold',
        features: ['Sync rep support', 'Exclusive library', 'Higher budget buyers'],
        uploadLimit: UPLOAD_LIMITS.ROSTERED,
        commission: 50, // 50% platform fee (includes rep support)
      };
  }
};

export const getBuyerTierInfo = (tier: BuyerTier) => {
  switch (tier) {
    case 'CREATOR':
      return {
        name: 'Creator',
        description: 'YouTube, Social Media, Small Businesses',
        price: '$20/month',
        color: 'green',
        features: ['Access to Artist & Label library', 'Self-serve deals', 'Unlimited purchases'],
        accessLevel: 'Artist & Label tracks',
      };
    case 'STUDIO':
      return {
        name: 'Studio',
        description: 'Indie filmmakers, Ad agencies, Podcasts, Game devs',
        price: '$50/month',
        color: 'orange',
        features: ['Creator features', 'Limited Rostered access via reps', 'Priority support'],
        accessLevel: 'Artist & Label tracks + Rep-assisted Rostered access',
      };
    case 'PRO':
      return {
        name: 'Pro',
        description: 'Music supervisors & executives with big budgets',
        price: 'Request Access',
        color: 'red',
        features: ['Exclusive Rostered library', 'Sync Rep support', 'Premium features'],
        accessLevel: 'Full Rostered library + optional full access',
      };
  }
};

// Tier badge styling
export const getTierBadgeClass = (tier: UserTier): string => {
  const info = getTierInfo(tier);
  const baseClass = 'px-2 py-1 rounded text-xs font-medium';

  switch (info.color) {
    case 'purple':
      return `${baseClass} bg-purple-500/10 text-purple-400 border border-purple-500/20`;
    case 'blue':
      return `${baseClass} bg-blue-500/10 text-blue-400 border border-blue-500/20`;
    case 'gold':
      return `${baseClass} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`;
    case 'green':
      return `${baseClass} bg-green-500/10 text-green-400 border border-green-500/20`;
    case 'orange':
      return `${baseClass} bg-orange-500/10 text-orange-400 border border-orange-500/20`;
    case 'red':
      return `${baseClass} bg-red-500/10 text-red-400 border border-red-500/20`;
    default:
      return `${baseClass} bg-gray-500/10 text-gray-400 border border-gray-500/20`;
  }
};