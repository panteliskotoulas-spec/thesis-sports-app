import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { FieldCard } from '@/components/fields/FieldCard';
import { FieldsGrid } from '@/components/fields/FieldsGrid';
import type { FieldListItem } from '@/lib/fields/types';

export async function HomeFeaturedFields({
  fields,
}: {
  fields: FieldListItem[];
}) {
  if (fields.length === 0) return null;

  const { t } = await getT('home');
  const lng = await routeLanguage();

  return (
    <section className="border-y-[0.5px] border-border bg-secondary">
      <div className="mx-auto w-full max-w-360 px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2>{t('featured.title')}</h2>
            <p className="mt-1 text-muted-foreground">
              {t('featured.subtitle')}
            </p>
          </div>
          <Link
            href={`/${lng}/fields?sort=rating`}
            className="shrink-0 text-sm font-medium text-accent-foreground hover:underline"
          >
            {t('featured.viewAll')}
          </Link>
        </div>
        <FieldsGrid>
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </FieldsGrid>
      </div>
    </section>
  );
}
