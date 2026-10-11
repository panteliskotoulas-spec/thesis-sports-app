import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { FieldsGrid } from '@/components/fields/FieldsGrid';
import {
  hasActiveCoachFilters,
  toCoachListItem,
  type CoachFilters,
  type CoachListItem,
} from '@/lib/coaches/coach-public';
import { getServerCaller } from '@/trpc/server/caller';
import { CoachCard } from './CoachCard';
import { CoachesEmpty } from './CoachesEmpty';
import { CoachesError } from './CoachesError';

export async function CoachesList({ filters }: { filters: CoachFilters }) {
  const { t } = await getT('coaches');
  const lng = await routeLanguage();

  let coaches: CoachListItem[];
  try {
    const caller = await getServerCaller();
    const rows = await caller.coaches.list(filters);
    coaches = rows.map((row) => toCoachListItem(row, lng));
  } catch (error) {
    console.error('[CoachesList]', error);
    return <CoachesError />;
  }

  if (coaches.length === 0) {
    return <CoachesEmpty hasFilters={hasActiveCoachFilters(filters)} />;
  }

  return (
    <section>
      <p className="mb-3 text-muted-foreground" aria-live="polite">
        {t('page.count', { count: coaches.length })}
      </p>
      <FieldsGrid>
        {coaches.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </FieldsGrid>
    </section>
  );
}
