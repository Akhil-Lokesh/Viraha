import apiClient from './client';

export interface AtlasData {
  countries: Array<{
    country: string;
    continent: string;
    cityCount: number;
    postCount: number;
  }>;
  cities: Array<{
    city: string;
    country: string;
    postCount: number;
    firstVisit: string;
    latestVisit: string;
  }>;
  stats: {
    totalCountries: number;
    totalCities: number;
    totalContinents: number;
    totalPosts: number;
    totalJournals: number;
    totalEntries: number;
    continentsVisited: string[];
  };
  travelStyle: string;
}

export interface SeasonalReflection {
  season: string;
  year: number;
  stats: {
    postsCreated: number;
    newCitiesVisited: number;
    journalsWritten: number;
  };
  highlights: Array<{
    id: string;
    thumbnail: string | null;
    locationName: string | null;
    caption: string | null;
  }>;
}

export async function getAtlas(): Promise<AtlasData> {
  const res = await apiClient.get('/atlas');
  return res.data.data;
}

export async function getSeasonalReflection(): Promise<SeasonalReflection> {
  const res = await apiClient.get('/atlas/seasonal');
  return res.data.data;
}
