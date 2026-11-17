import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../lib/cache';
import {
  searchPlaces,
  getGooglePlaceDetails,
  type PlaceDetails,
  type PlacePrediction,
} from '../services/placeSearch';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 120;
const AUTOCOMPLETE_TTL_SECONDS = 3600;
const DETAILS_TTL_SECONDS = 86400;

function queryString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function coordinate(value: unknown, limit: number): string | null {
  const parsed = Number(queryString(value));
  return queryString(value) !== '' && Number.isFinite(parsed) && Math.abs(parsed) <= limit ? String(parsed) : null;
}

export async function autocomplete(req: Request, res: Response, next: NextFunction) {
  try {
    const input = queryString(req.query.input).slice(0, MAX_QUERY_LENGTH);
    if (input.length < MIN_QUERY_LENGTH) {
      res.json({ success: true, data: { predictions: [] } });
      return;
    }

    const lat = coordinate(req.query.lat, 90);
    const lng = coordinate(req.query.lng, 180);
    const near = lat && lng ? { lat, lng } : undefined;

    const cacheKey = `places:auto:v2:${input.toLowerCase()}`;
    const cached = await cacheGet<{ predictions: PlacePrediction[] }>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const { predictions, cacheable } = await searchPlaces(input, near);
    const data = { predictions };
    if (cacheable) await cacheSet(cacheKey, data, AUTOCOMPLETE_TTL_SECONDS);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const placeId = queryString(req.params.placeId);
    if (!placeId) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'placeId is required' } });
      return;
    }

    const cacheKey = `places:detail:${placeId}`;
    const place = (await cacheGet<PlaceDetails>(cacheKey)) ?? (await getGooglePlaceDetails(placeId));
    if (!place) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Place not found' } });
      return;
    }

    await cacheSet(cacheKey, place, DETAILS_TTL_SECONDS);
    res.json({ success: true, data: { place } });
  } catch (err) {
    next(err);
  }
}
