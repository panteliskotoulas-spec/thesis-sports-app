import type { SportType } from '@/lib/fields/types';

export const MAX_IMAGES = 6;
export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const AREA_MAX = 120;
export const ADDRESS_MAX = 200;
export const COORDINATES_MAX = 60;

export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

export type ImageItem =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File };

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NewFieldValues {
  name: string;
  description: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  indoor: boolean;
  sports: SportType[];
  images: ImageItem[];
}

export type NewFieldErrorKey =
  | 'name'
  | 'description'
  | 'area'
  | 'address'
  | 'coordinates'
  | 'sports'
  | 'images';

export type NewFieldErrors = Partial<Record<NewFieldErrorKey, string>>;

const COORDINATE_NUMBER = /^-?\d{1,3}(?:\.\d+)?$/;

export function parseCoordinates(input: string): Coordinates | null {
  const parts = input
    .trim()
    .split(/\s*[,;]\s*|\s+/)
    .filter(Boolean);

  if (parts.length !== 2) return null;
  if (!parts.every((part) => COORDINATE_NUMBER.test(part))) return null;

  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { latitude, longitude };
}
