export const GENRES = [
  { id: 'hiphop', label: 'Hip Hop' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'classical', label: 'Classical' },
] as const;

export const MOODS = [
  { id: 'moody', label: 'Moody' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'hopeful', label: 'Hopeful' },
  { id: 'cinematic', label: 'Cinematic' },
] as const;

export const MEDIA_TYPES = [
  { id: 'film', label: 'Film' },
  { id: 'tv', label: 'TV' },
  { id: 'ads', label: 'Advertising' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'games', label: 'Video Games' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'social', label: 'Social Media' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'trailers', label: 'Trailers' },
] as const;

// Traditional media types - Base Price only (negotiation-based)
export const TRADITIONAL_MEDIA_TYPES = ['film', 'tv', 'ads', 'games'] as const;

// Digital/Social media types - Base Price + Optional Buyout Price
export const DIGITAL_MEDIA_TYPES = ['social', 'podcasts', 'youtube'] as const;

// Get media type category
export const getMediaTypeCategory = (mediaTypeId: string): 'traditional' | 'digital' | 'other' => {
  if (TRADITIONAL_MEDIA_TYPES.includes(mediaTypeId as any)) return 'traditional';
  if (DIGITAL_MEDIA_TYPES.includes(mediaTypeId as any)) return 'digital';
  return 'other';
};

export const PERFORMING_RIGHTS_ORGS = [
  { id: 'ascap', label: 'ASCAP' },
  { id: 'bmi', label: 'BMI' },
  { id: 'sesac', label: 'SESAC' },
  { id: 'none', label: 'None' },
] as const;

export const LICENSE_TYPES = [
  { id: 'exclusive', label: 'Exclusive' },
  { id: 'non-exclusive', label: 'Non-exclusive' },
] as const;

export const ROYALTY_COLLECTION_ENTITIES = [
  { id: 'songtrust', label: 'Songtrust' },
  { id: 'cdbaby-pro', label: 'CD Baby Pro' },
  { id: 'tunecore', label: 'TuneCore' },
  { id: 'distrokid', label: 'DistroKid' },
  { id: 'other', label: 'Other' },
] as const;

export const DISALLOWED_USES = [
  { id: 'no-political', label: 'No political ads' },
  { id: 'no-religious', label: 'No religious content' },
  { id: 'no-adult', label: 'No adult content' },
  { id: 'no-violent', label: 'No violent content' },
  { id: 'no-gambling', label: 'No gambling ads' },
  { id: 'no-pharmaceutical', label: 'No pharmaceutical ads' },
  { id: 'no-alcohol-tobacco', label: 'No alcohol/tobacco ads' },
  { id: 'no-competitors', label: 'No competitor brands' },
  { id: 'no-negative', label: 'No negative/controversial content' },
] as const;

export const ENTITY_TYPES = [
  { id: 'artist', label: 'Artist' },
  { id: 'label', label: 'Record Label' },
  { id: 'producer', label: 'Producer' },
  { id: 'other', label: 'Other' },
] as const;

export const PUBLISHER_TYPES = [
  { id: 'self-published', label: 'Self-Published' },
  { id: 'admin', label: 'Publishing Administrator' },
  { id: 'co-publisher', label: 'Co-Publisher' },
  { id: 'sub-publisher', label: 'Sub-Publisher' },
  { id: 'major-publisher', label: 'Major Publisher' },
] as const;

export const TERRITORY_RIGHTS = [
  { id: 'worldwide', label: 'Worldwide' },
  { id: 'us', label: 'United States' },
  { id: 'canada', label: 'Canada' },
  { id: 'uk', label: 'United Kingdom' },
  { id: 'europe', label: 'Europe' },
  { id: 'other', label: 'Other Territory' },
] as const;

export const SONGWRITER_ROLES = [
  { id: 'lyrics', label: 'Lyrics' },
  { id: 'music', label: 'Music' },
  { id: 'both', label: 'Both Lyrics & Music' },
  { id: 'topliner', label: 'Topliner' },
  { id: 'producer-writer', label: 'Producer/Writer' },
] as const;

export type Genre = typeof GENRES[number]['id'];
export type Mood = typeof MOODS[number]['id'];
export type MediaType = typeof MEDIA_TYPES[number]['id'];
export type PerformingRightsOrg = typeof PERFORMING_RIGHTS_ORGS[number]['id'];
export type LicenseType = typeof LICENSE_TYPES[number]['id'];
export type RoyaltyCollectionEntity = typeof ROYALTY_COLLECTION_ENTITIES[number]['id'];
export type DisallowedUse = typeof DISALLOWED_USES[number]['id'];
export type EntityType = typeof ENTITY_TYPES[number]['id'];
export type PublisherType = typeof PUBLISHER_TYPES[number]['id'];
export type TerritoryRight = typeof TERRITORY_RIGHTS[number]['id'];
export type SongwriterRole = typeof SONGWRITER_ROLES[number]['id'];