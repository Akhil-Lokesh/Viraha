import { describe, it, expect, vi, afterEach } from 'vitest';
import { photonFeatureToPrediction, searchPlaces } from '../services/placeSearch';

describe('place search (keyless OpenStreetMap fallback)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps a landmark to a prediction carrying coordinates, city and country', () => {
    const prediction = photonFeatureToPrediction({
      geometry: { coordinates: [2.2945, 48.8584] },
      properties: { osm_type: 'W', osm_id: 5013364, name: 'Eiffel Tower', city: 'Paris', state: 'Ile-de-France', country: 'France', type: 'house' },
    });

    expect(prediction).toMatchObject({
      placeId: 'osm:W5013364',
      mainText: 'Eiffel Tower',
      secondaryText: 'Paris, Ile-de-France, France',
      details: { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, city: 'Paris', country: 'France' },
    });
  });

  it('treats a city result as its own city', () => {
    const prediction = photonFeatureToPrediction({
      geometry: { coordinates: [139.69, 35.68] },
      properties: { osm_type: 'R', osm_id: 1, name: 'Tokyo', country: 'Japan', type: 'city' },
    });

    expect(prediction?.details).toMatchObject({ city: 'Tokyo', country: 'Japan' });
    expect(prediction?.description).toBe('Tokyo, Japan');
  });

  it('drops features without a name or coordinates', () => {
    expect(photonFeatureToPrediction({ properties: { name: 'Nowhere' } })).toBeNull();
    expect(photonFeatureToPrediction({ geometry: { coordinates: [1, 2] }, properties: {} })).toBeNull();
  });

  it('returns de-duplicated predictions from the provider', async () => {
    const feature = { geometry: { coordinates: [12.49, 41.89] }, properties: { osm_type: 'N', osm_id: 7, name: 'Rome', country: 'Italy', type: 'city' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [feature, feature] }) }));

    const result = await searchPlaces('rome');

    expect(result.cacheable).toBe(true);
    expect(result.predictions).toHaveLength(1);
  });

  it('degrades to an uncacheable empty result when the provider is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(searchPlaces('rome')).resolves.toEqual({ predictions: [], cacheable: false });
  });
});
