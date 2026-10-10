import type { GeocodeResult, NewFieldValues } from '@/lib/fields/new-field';

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function geocodeAddress(
  query: string,
): Promise<GeocodeResult | null> {
  await wait(600);
  if (query.toLowerCase().includes('xxx')) return null;
  return { label: query, latitude: 37.93, longitude: 23.76 };
}

export async function submitNewField(
  values: NewFieldValues,
): Promise<{ id: string }> {
  await wait(800);
  void values;
  return { id: 'seed-1' };
}
