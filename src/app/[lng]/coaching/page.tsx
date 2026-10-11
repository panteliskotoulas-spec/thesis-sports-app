import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { CoachSessionsList } from '@/components/coaches/sessions/CoachSessionsList';
import { toCoachSessionItem } from '@/lib/coaches/coach-session';
import { buildCoachSessionsLabels } from '@/lib/coaches/coach-session-labels';
import { mockCoachSessionRows } from '@/lib/coaches/coach-session-mock';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('sessions.meta') };
}

export default async function CoachingSessionsPage() {
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const now = new Date();
  const items = mockCoachSessionRows(now).map((row) =>
    toCoachSessionItem(row, lng, tf(`sports.${row.sportType}`), now),
  );

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/bookings`}
          className="inline-flex h-10 items-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('sessions.back')}
        </Link>

        <h1 className="mt-2">{t('sessions.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('sessions.subtitle')}</p>

        <div className="mt-6">
          <CoachSessionsList
            items={items}
            browseHref={`/${lng}/coaches`}
            labels={buildCoachSessionsLabels(t)}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
