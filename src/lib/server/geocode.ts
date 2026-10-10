import 'server-only';

import type { GeocodeResult } from '@/lib/fields/new-field';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MAX_RESULTS = 5;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const MIN_INTERVAL_MS = 1100;
const REQUEST_TIMEOUT_MS = 8000;

interface NominatimPlace {
  lat: string;
  lon: string;
  display_name: string;
}

const cache = new Map<string, { expires: number; results: GeocodeResult[] }>();
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function userAgent(): string {
  const contact = process.env.CONTACT_EMAIL;
  return contact
    ? `sports-app-thesis/1.0 (${contact})`
    : 'sports-app-thesis/1.0';
}

function cacheKey(query: string, lng: string): string {
  return `${lng}|${query.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await pause(wait);
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

function toResults(places: NominatimPlace[]): GeocodeResult[] {
  return places.flatMap((place) => {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [{ label: place.display_name, latitude, longitude }];
  });
}

export async function searchAddress(
  query: string,
  lng: string,
): Promise<GeocodeResult[]> {
  const key = cacheKey(query, lng);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.results;

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'jsonv2',
    limit: String(MAX_RESULTS),
    countrycodes: 'gr',
    'accept-language': lng,
  });

  const results = await throttled(async () => {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: { 'User-Agent': userAgent() },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }

    return toResults((await response.json()) as NominatimPlace[]);
  });

  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, results });

  return results;
}
