'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SlotDateBar,
  type SlotDateBarLabels,
} from '@/components/owner/slots/SlotDateBar';
import {
  createCoachSlot,
  deleteCoachSlot,
} from '@/lib/coaches/coach-slots-api';
import type { CoachSlotItem } from '@/lib/coaches/coach-public';
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
  sportType: SportType;
  selectedDay: string;
  today: string;
  tomorrow: string;
  dayLabel: string;
  slots: CoachSlotItem[];
  labels: CoachSlotsManagerLabels;
}

export function CoachSlotsManager({
  sportType,
  selectedDay,
  today,
  tomorrow,
  dayLabel,
  slots,
  labels,
}: CoachSlotsManagerProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);

    const result = await deleteCoachSlot(id);

    setDeletingId(null);

    if (result.status === 'ok') {
      router.refresh();
      return;
    }

    if (result.status === 'conflict') {
      setDeleteError(labels.deleteConflict);
      router.refresh();
      return;
    }

    setDeleteError(labels.deleteError);
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

      <div>
        <CoachSlotList
          slots={slots}
          deletingId={deletingId}
          labels={labels.list}
          onDelete={handleDelete}
        />
        {deleteError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {deleteError}
          </p>
        ) : null}
      </div>

      <CoachSlotForm
        sportType={sportType}
        selectedDay={selectedDay}
        today={today}
        labels={labels.form}
        onCreate={async (input) => {
          const result = await createCoachSlot(input);
          if (result.status === 'ok') {
            if (input.date !== selectedDay) {
              router.push(`?date=${input.date}`, { scroll: false });
            } else {
              router.refresh();
            }
          }
          return result;
        }}
      />
    </div>
  );
}
