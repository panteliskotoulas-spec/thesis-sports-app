import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { SearchX } from 'lucide-react';
import { getT } from '@/i18n.server';

export async function TeamsEmpty({
  hasFilters = false,
}: {
  hasFilters?: boolean;
}) {
  const { t } = await getT('teams');
  const lng = await routeLanguage();

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-dashed border-border px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <SearchX className="size-6" aria-hidden="true" />
      </span>
      <h3>{t('empty.title')}</h3>
      <p className="max-w-sm text-muted-foreground">{t('empty.description')}</p>
      <Link
        href={hasFilters ? `/${lng}/teams` : `/${lng}/teams/new`}
        className="mt-2 inline-flex h-11 items-center rounded-full border-[0.5px] border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-secondary"
      >
        {hasFilters ? t('empty.clear') : t('empty.create')}
      </Link>
    </div>
  );
}
