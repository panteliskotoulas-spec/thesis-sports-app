import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { hasActiveFilters, type FieldFilters } from '@/lib/fields/filters';
import { queryMockFields } from '@/lib/fields/mock-query';
import { toFieldListItem, type FieldListItem } from '@/lib/fields/types';
import { FieldCard } from './FieldCard';
import { FieldsEmpty } from './FieldsEmpty';
import { FieldsError } from './FieldsError';
import { FieldsGrid } from './FieldsGrid';
import { FieldsSort } from './FieldsSort';

export async function FieldsList({ filters }: { filters: FieldFilters }) {
  const { t } = await getT('fields');
  const lng = await routeLanguage();

  let fields: FieldListItem[];
  try {
    fields = queryMockFields(filters).map((row) => toFieldListItem(row, lng));
  } catch (error) {
    console.error('[FieldsList]', error);
    return <FieldsError />;
  }

  if (fields.length === 0) {
    return <FieldsEmpty hasFilters={hasActiveFilters(filters)} />;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-muted-foreground" aria-live="polite">
          {t('page.count', { count: fields.length })}
        </p>
        <FieldsSort
          filters={filters}
          label={t('sort.label')}
          options={{
            newest: t('sort.newest'),
            price: t('sort.price'),
            rating: t('sort.rating'),
          }}
        />
      </div>
      <FieldsGrid>
        {fields.map((field) => (
          <FieldCard key={field.id} field={field} />
        ))}
      </FieldsGrid>
    </section>
  );
}
