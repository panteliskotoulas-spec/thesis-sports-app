import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { CoachFlowError } from '@/components/coaches/CoachFlowError';
import { CoachRequestsList } from '@/components/coaches/requests/CoachRequestsList';
import {
  toCoachRequestItem,
  type CoachRequestRow,
} from '@/lib/coaches/coach-session';
import { buildCoachRequestsLabels } from '@/lib/coaches/coach-session-labels';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('requests.meta') };
}

export default async function CoachRequestsPage() {
  const { t } = await getT('coaches');
  const { t: tc } = await getT('chat');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const record = await caller.coaches.getMine();
  const approved = record?.status === 'APPROVED';

  let rows: CoachRequestRow[] | null = null;

  if (approved) {
    try {
      rows = await caller.coachSessions.listIncoming();
    } catch (error) {
      console.error('[coach requests page]', error);
    }
  }

  const items = rows ? rows.map((row) => toCoachRequestItem(row, lng)) : null;

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/coaches/slots`}
          className="inline-flex h-10 items-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('requests.back')}
        </Link>

        <h1 className="mt-2">{t('requests.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('requests.subtitle')}</p>

        <div className="mt-6 md:mt-8">
          {!approved ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('requests.notApproved.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('requests.notApproved.description')}
              </p>
              <Link
                href={`/${lng}/coaches/apply`}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t('requests.notApproved.cta')}
              </Link>
            </div>
          ) : !items ? (
            <CoachFlowError
              title={t('requests.error.title')}
              description={t('requests.error.description')}
              retry={t('requests.error.retry')}
              href={`/${lng}/coaches/requests`}
            />
          ) : (
            <CoachRequestsList
              lng={lng}
              items={items}
              labels={buildCoachRequestsLabels(t, tc)}
            />
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
