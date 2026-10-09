import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';

export async function FieldsError() {
  const { t } = await getT('fields');
  const lng = await routeLanguage();

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border-[0.5px] border-border bg-card px-6 py-12 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h3>{t('error.title')}</h3>
      <p className="max-w-sm text-muted-foreground">{t('error.description')}</p>
      {/* Η "δοκίμασε ξανά" είναι σύνδεσμος στην ίδια σελίδα (ξαναφορτώνει τα δεδομένα). */}
      <Link
        href={`/${lng}/fields`}
        className="mt-2 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {t('error.retry')}
      </Link>
    </div>
  );
}
