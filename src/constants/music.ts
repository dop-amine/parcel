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

export type Genre = typeof GENRES[number]['id'];
export type Mood = typeof MOODS[number]['id'];