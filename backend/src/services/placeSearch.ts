import { env } from '../config/env';
import { logger } from '../lib/logger';

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  /** Present when the provider resolves coordinates in the search itself. */
  details?: PlaceDetails;
}

export interface PlaceSearchResult {
  predictions: PlacePrediction[];
  /** False when the provider call failed — the caller must not cache it. */
  cacheable: boolean;
}

const GOOGLE_BASE = 'https://maps.googleapis.com/maps/api/place';
const PHOTON_URL = 'https://photon.komoot.io/api/';
const REQUEST_TIMEOUT_MS = 5000;
const MAX_RESULTS = 6;

// Google statuses that are a complete answer. Anything else (denied key,
// exhausted quota) is a failure and must not be cached as "no results".
const GOOGLE_COMPLETE_STATUSES = new Set(['OK', 'ZERO_RESULTS']);

interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
}

interface GoogleAddressComponent {
  long_name: string;
  types: string[];
}

interface GoogleDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: { location?: { lat: number; lng: number } };
  address_components?: GoogleAddressComponent[];
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    type?: string;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Place provider responded ${response.status}`);
  return (await response.json()) as T;
}

async function searchGoogle(input: string, apiKey: string, near?: { lat: string; lng: string }): Promise<PlaceSearchResult> {
  const params = new URLSearchParams({ input, key: apiKey, types: 'geocode|establishment' });
  if (near) {
    params.set('location', `${near.lat},${near.lng}`);
    params.set('radius', '50000');
  }

  const data = await fetchJson<{ status: string; error_message?: string; predictions?: GooglePrediction[] }>(
    `${GOOGLE_BASE}/autocomplete/json?${params}`,
  );

  if (!GOOGLE_COMPLETE_STATUSES.has(data.status)) {
    logger.warn({ status: data.status, errorMessage: data.error_message }, 'Google Places autocomplete failed');
    return { predictions: [], cacheable: false };
  }

  return {
    cacheable: true,
    predictions: (data.predictions ?? []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
    })),
  };
}

/** Maps one Photon (OpenStreetMap) feature to a prediction with coordinates, or null if unusable. */
export function photonFeatureToPrediction(feature: PhotonFeature): PlacePrediction | null {
  const props = feature.properties;
  const coords = feature.geometry?.coordinates;
  if (!props?.name || !coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return null;

  const isCity = props.type === 'city' || props.type === 'town' || props.type === 'village';
  const city = isCity ? props.name : (props.city ?? null);
  const country = props.country ?? null;
  const secondaryText = [isCity ? null : props.city, props.state, country]
    .filter((part): part is string => Boolean(part) && part !== props.name)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(', ');
  const description = secondaryText ? `${props.name}, ${secondaryText}` : props.name;
  const placeId = `osm:${props.osm_type ?? 'X'}${props.osm_id ?? `${coords[1]},${coords[0]}`}`;

  return {
    placeId,
    description,
    mainText: props.name,
    secondaryText,
    details: { placeId, name: props.name, address: description, lat: coords[1], lng: coords[0], city, country },
  };
}

async function searchPhoton(input: string, near?: { lat: string; lng: string }): Promise<PlaceSearchResult> {
  const params = new URLSearchParams({ q: input, limit: String(MAX_RESULTS), lang: 'en' });
  if (near) {
    params.set('lat', near.lat);
    params.set('lon', near.lng);
  }

  const data = await fetchJson<{ features?: PhotonFeature[] }>(`${PHOTON_URL}?${params}`);
  const seen = new Set<string>();
  const predictions = (data.features ?? [])
    .map(photonFeatureToPrediction)
    .filter((p): p is PlacePrediction => p !== null)
    .filter((p) => (seen.has(p.description) ? false : (seen.add(p.description), true)));

  return { predictions, cacheable: true };
}

/**
 * Place autocomplete. Uses Google Places when a key is configured and falls
 * back to the keyless OpenStreetMap geocoder otherwise, so tagging a location
 * works out of the box.
 */
export async function searchPlaces(input: string, near?: { lat: string; lng: string }): Promise<PlaceSearchResult> {
  try {
    return env.GOOGLE_PLACES_API_KEY
      ? await searchGoogle(input, env.GOOGLE_PLACES_API_KEY, near)
      : await searchPhoton(input, near);
  } catch (err) {
    logger.warn({ err }, 'Place search provider unavailable');
    return { predictions: [], cacheable: false };
  }
}

/** Resolves a Google place id to coordinates. Null when unknown or unconfigured. */
export async function getGooglePlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!env.GOOGLE_PLACES_API_KEY) return null;

  const params = new URLSearchParams({
    place_id: placeId,
    key: env.GOOGLE_PLACES_API_KEY,
    fields: 'place_id,name,formatted_address,geometry,address_components',
  });
  const data = await fetchJson<{ status: string; result?: GoogleDetailsResult }>(`${GOOGLE_BASE}/details/json?${params}`);
  const result = data.result;
  const location = result?.geometry?.location;
  if (data.status !== 'OK' || !result || !location) return null;

  const component = (type: string): string | null =>
    result.address_components?.find((c) => c.types.includes(type))?.long_name ?? null;

  return {
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address,
    lat: location.lat,
    lng: location.lng,
    city: component('locality'),
    country: component('country'),
  };
}
