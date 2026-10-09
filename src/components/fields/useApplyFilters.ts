'use client';

import { usePathname, useRouter } from 'next/navigation';
import { buildFieldsQuery, type FieldFilters } from '@/lib/fields/filters';

export function useApplyFilters() {
  const router = useRouter();
  const pathname = usePathname();

  return (next: FieldFilters, options?: { replace?: boolean }) => {
    const query = buildFieldsQuery(next);
    const url = query ? `${pathname}?${query}` : pathname;

    if (options?.replace) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url, { scroll: false });
    }
  };
}
