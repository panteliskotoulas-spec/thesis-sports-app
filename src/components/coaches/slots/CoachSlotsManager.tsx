'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SlotDateBar,
  type SlotDateBarLabels,
} from '@/components/owner/slots/SlotDateBar';
import type {
  CoachSlotItem,
  CreateCoachSlotInput,
} from '@/lib/coaches/coach-public';
import { formatPricePerHour } from '@/lib/fields/format';
import type { CreateSlotResult } from '@/lib/fields/owner-slots';
import type { SportType } from '@/lib/fields/types';
import { CoachSlotForm, type CoachSlotFormLabels } from './CoachSlotForm';
import { CoachSlotList, type CoachSlotListLabels } from './CoachSlotList';

export interface CoachSlotsManagerLabels {
  dateBar: SlotDateBarLabels;
  list: CoachSlotListLabels;
  form: CoachSlotFormLabels;
  deleteConflict: string;
  deleteError: string;
}

export interface CoachSlotsManagerProps {
  lng: string;
  sportType: SportType;
  selectedDay: string;
  today: string;
  tomorrow: string;
  dayLabel: string;
  slots: CoachSlotItem[];
  labels: CoachSlotsManagerLabels;
}

export function CoachSlotsManager({
  lng,
  sportType,
  selectedDay,
  today,
  tomorrow,
  dayLabel,
  slots: initialSlots,
  labels,
}: CoachSlotsManagerProps) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(
    input: CreateCoachSlotInput,
  ): Promise<CreateSlotResult> {
    if (input.date === selectedDay) {
      setSlots((current) =>
        [
          ...current,
          {
            id: `local-${Date.now()}`,
            time: `${input.startTime}–${input.endTime}`,
            price: formatPricePerHour(input.price, lng),
            status: 'OPEN' as const,
          },
        ].sort((a, b) => a.time.localeCompare(b.time)),
      );
    } else {
      router.push(`?date=${input.date}`, { scroll: false });
    }
    return { status: 'ok' };
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    setSlots((current) => current.filter((slot) => slot.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <SlotDateBar
        selectedDay={selectedDay}
        today={today}
        tomorrow={tomorrow}
        dayLabel={dayLabel}
        labels={labels.dateBar}
      />

      <CoachSlotList
        slots={slots}
        deletingId={deletingId}
        labels={labels.list}
        onDelete={handleDelete}
      />

      <CoachSlotForm
        sportType={sportType}
        selectedDay={selectedDay}
        today={today}
        labels={labels.form}
        onCreate={handleCreate}
      />
    </div>
  );
}
