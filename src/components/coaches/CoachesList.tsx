import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { FieldsGrid } from '@/components/fields/FieldsGrid';
import { mockListCoaches } from '@/lib/coaches/coach-mock';
import {
  hasActiveCoachFilters,
  toCoachListItem,
  type CoachFilters,
} from '@/lib/coaches/coach-public';
import { CoachCard } from './CoachCard';
import { CoachesEmpty } from './CoachesEmpty';

export async function CoachesList({ filters }: { filters: CoachFilters }) {
  const { t } = await getT('coaches');
  const lng = await routeLanguage();

  const coaches = mockListCoaches(filters).map((row) =>
    toCoachListItem(row, lng),
  );

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
