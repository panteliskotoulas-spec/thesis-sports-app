import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TeamSplitPayment } from '@/components/teams/TeamSplitPayment';
import { formatDayChip, formatTimeRange } from '@/lib/fields/detail-format';
import { todayInAthens } from '@/lib/fields/filters';
import { getCurrentUser } from '@/lib/session';
import { buildSessionSplitPaymentLabels } from '@/lib/teams/team-labels';
import type { SessionSplitPayRow } from '@/lib/teams/team-split';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('meta.splitPay') };
}

export default async function TeamSessionSplitPayPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const backHref = `/${lng}/teams/${id}`;

  let row: SessionSplitPayRow;
  try {
    row = await caller.sessionSplits.getForPay({ teamId: id, sessionId });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
      redirect(backHref);
    }
    throw error;
  }

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={backHref}
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('splitPay.back')}
        </Link>

        <h1 className="mt-2">{t('splitPay.title')}</h1>

        <div className="mt-6">
          <TeamSplitPayment
            lng={lng}
            target={{ kind: 'session', id: sessionId }}
            title={row.coachName}
            date={formatDayChip(todayInAthens(row.startTime), lng).full}
            time={formatTimeRange(row.startTime, row.endTime, lng)}
            leaderName={row.leaderName}
            share={row.share}
            balance={row.balance}
            backHref={backHref}
            labels={buildSessionSplitPaymentLabels(t, tf)}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
