import type { SportType } from '@/lib/fields/types';

export const MAX_IMAGES = 6;
export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const AREA_MAX = 120;
export const ADDRESS_MAX = 200;

export interface GeocodeResult {
  label: string;
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
  images: File[];
}

export type NewFieldErrorKey =
  | 'name'
  | 'description'
  | 'area'
  | 'address'
  | 'sports'
  | 'images';

export type NewFieldErrors = Partial<Record<NewFieldErrorKey, string>>;
