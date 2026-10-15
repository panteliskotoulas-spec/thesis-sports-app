import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { CoachFlowError } from '@/components/coaches/CoachFlowError';
import { CoachSessionsList } from '@/components/coaches/sessions/CoachSessionsList';
import {
  toCoachSessionItem,
  type CoachSessionRow,
} from '@/lib/coaches/coach-session';
import { buildCoachSessionsLabels } from '@/lib/coaches/coach-session-labels';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('sessions.meta') };
}

export default async function CoachingSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; payment?: string }>;
}) {
  const query = await searchParams;
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const { t: tr } = await getT('reviews');
  const { t: tt } = await getT('teams');
  const { t: tc } = await getT('chat');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const now = new Date();
  const caller = await getServerCaller();

  let rows: CoachSessionRow[] | null = null;
  let balance = 0;

  try {
    const result = await caller.coachSessions.listMine();
    rows = result.rows;
    balance = result.balance;
  } catch (error) {
    console.error('[coaching page]', error);
  }

  const items = rows
    ? rows.map((row) =>
        toCoachSessionItem(row, lng, tf(`sports.${row.sportType}`), now),
      )
    : null;

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

        {query.payment === 'failed' ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl border-[0.5px] border-terracotta bg-card p-4 text-sm text-foreground"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-terracotta"
              aria-hidden="true"
            />
            {t('sessions.paymentFailed')}
          </div>
        ) : null}

        <div className="mt-6">
          {items ? (
            <CoachSessionsList
              items={items}
              lng={lng}
              balance={balance}
              justPaid={query.paid === '1'}
              browseHref={`/${lng}/coaches`}
              labels={buildCoachSessionsLabels(t, tf, tr, tt, tc)}
            />
          ) : (
            <CoachFlowError
              title={t('sessions.error.title')}
              description={t('sessions.error.description')}
              retry={t('sessions.error.retry')}
              href={`/${lng}/coaching`}
            />
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
