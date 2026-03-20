import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { cacheGet, cacheSet } from '../lib/cache';

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

export async function autocomplete(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.query.input as string;
    if (!input || input.length < 2) {
      res.json({ success: true, data: { predictions: [] } });
      return;
    }

    if (!env.GOOGLE_PLACES_API_KEY) {
      res.json({ success: true, data: { predictions: [] } });
      return;
    }

    const cacheKey = `places:auto:${input.toLowerCase()}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const params = new URLSearchParams({
      input,
      key: env.GOOGLE_PLACES_API_KEY,
      types: 'geocode|establishment',
    });

    const lat = req.query.lat as string;
    const lng = req.query.lng as string;
    if (lat && lng) {
      params.set('location', `${lat},${lng}`);
      params.set('radius', '50000');
    }

    const response = await fetch(`${PLACES_API_BASE}/autocomplete/json?${params}`);
    const data: any = await response.json();

    const result = {
      predictions: (data.predictions || []).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text,
        secondaryText: p.structured_formatting?.secondary_text,
      })),
    };

    await cacheSet(cacheKey, result, 3600);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const placeId = req.params.placeId as string;
    if (!placeId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'placeId is required' },
      });
      return;
    }

    if (!env.GOOGLE_PLACES_API_KEY) {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_CONFIGURED', message: 'Google Places API key not configured' },
      });
      return;
    }

    const cacheKey = `places:detail:${placeId}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: env.GOOGLE_PLACES_API_KEY,
      fields: 'place_id,name,formatted_address,geometry,address_components',
    });

    const response = await fetch(`${PLACES_API_BASE}/details/json?${params}`);
    const data: any = await response.json();

    if (data.status !== 'OK' || !data.result) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Place not found' },
      });
      return;
    }

    const r = data.result;
    const components = r.address_components || [];
    const city = components.find((c: any) => c.types.includes('locality'))?.long_name || null;
    const country = components.find((c: any) => c.types.includes('country'))?.long_name || null;

    const result = {
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      city,
      country,
    };

    await cacheSet(cacheKey, result, 86400);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
