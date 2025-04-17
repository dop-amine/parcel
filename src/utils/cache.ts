import { api } from "@/utils/api";

const waveformCache = new Map<string, number[]>();

export const getWaveformData = async (trackId: string): Promise<number[] | null> => {
  // Check cache first
  if (waveformCache.has(trackId)) {
    return waveformCache.get(trackId) ?? null;
  }

  try {
    // Fetch from API
    const data = await api.track.getWaveformData.fetch({ trackId });

    // Cache the result
    if (data) {
      waveformCache.set(trackId, data);
    }

    return data;
  } catch (error) {
    console.error('Error fetching waveform data:', error);
    return null;
  }
};

export const clearWaveformCache = () => {
  waveformCache.clear();
};