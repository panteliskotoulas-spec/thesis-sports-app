'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export interface FieldDayListProps {
  selectedDay: string | null;
  children: ReactNode;
}

export function FieldDayList({ selectedDay, children }: FieldDayListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[aria-current="date"]');
    if (!list || !selected) return;
    const target =
      selected.offsetLeft - (list.clientWidth - selected.clientWidth) / 2;
    list.scrollTo({ left: Math.max(target, 0), behavior: 'auto' });
  }, [selectedDay]);

  return (
    <ul
      ref={listRef}
      className="relative flex items-stretch gap-2 overflow-x-auto pb-1"
    >
      {children}
    </ul>
  );
}
