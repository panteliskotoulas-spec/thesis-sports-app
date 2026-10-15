import 'server-only';

import { toFieldListItem, type FieldListItem } from '@/lib/fields/types';
import { FEATURED_FIELDS_LIMIT } from '@/lib/home/home';
import { getServerCaller } from '@/trpc/server/caller';

export async function loadFeaturedFields(
  lng: string,
): Promise<FieldListItem[]> {
  try {
    const caller = await getServerCaller();
    const rows = await caller.fields.list({
      q: '',
      type: null,
      sport: null,
      date: null,
      sort: 'rating',
    });
    return rows
      .filter((row) => row.nextSlotAt !== null)
      .slice(0, FEATURED_FIELDS_LIMIT)
      .map((row) => toFieldListItem(row, lng));
  } catch (error) {
    console.error('[loadFeaturedFields]', error);
    return [];
  }
}
