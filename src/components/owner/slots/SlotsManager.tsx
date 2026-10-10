'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSlot, deleteSlot } from '@/lib/fields/owner-slots-api';
import type { OwnerSlotItem } from '@/lib/fields/owner-slots';
import type { SportType } from '@/lib/fields/types';
import { SlotDateBar, type SlotDateBarLabels } from './SlotDateBar';
import { SlotForm, type SlotFormLabels } from './SlotForm';
import { SlotList, type SlotListLabels } from './SlotList';

export interface SlotsManagerLabels {
  dateBar: SlotDateBarLabels;
  list: SlotListLabels;
  form: SlotFormLabels;
  deleteConflict: string;
  deleteError: string;
}

export interface SlotsManagerProps {
  fieldId: string;
  selectedDay: string;
  today: string;
  tomorrow: string;
  dayLabel: string;
  slots: OwnerSlotItem[];
  sports: { value: SportType; label: string }[];
  labels: SlotsManagerLabels;
}

export function SlotsManager({
  fieldId,
  selectedDay,
  today,
  tomorrow,
  dayLabel,
  slots,
  sports,
  labels,
}: SlotsManagerProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);

    const result = await deleteSlot(id);

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
        <SlotList
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

      <SlotForm
        fieldId={fieldId}
        selectedDay={selectedDay}
        today={today}
        sports={sports}
        labels={labels.form}
        onCreate={async (input) => {
          const result = await createSlot(input);
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
