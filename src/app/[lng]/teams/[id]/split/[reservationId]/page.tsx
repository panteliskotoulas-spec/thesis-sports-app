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
import { localized } from '@/lib/i18n-content';
import { getCurrentUser } from '@/lib/session';
import { buildTeamSplitPaymentLabels } from '@/lib/teams/team-labels';
import type { TeamSplitPayRow } from '@/lib/teams/team-split';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('meta.splitPay') };
}

export default async function TeamSplitPayPage({
  params,
}: {
  params: Promise<{ id: string; reservationId: string }>;
}) {
  const { id, reservationId } = await params;
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const backHref = `/${lng}/teams/${id}`;

  let row: TeamSplitPayRow;
  try {
    row = await caller.splits.getForPay({ teamId: id, reservationId });
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
            target={{ kind: 'reservation', id: reservationId }}
            title={localized(row.fieldName, lng)}
            date={formatDayChip(todayInAthens(row.startTime), lng).full}
            time={formatTimeRange(row.startTime, row.endTime, lng)}
            leaderName={row.leaderName}
            share={row.share}
            balance={row.balance}
            backHref={backHref}
            labels={buildTeamSplitPaymentLabels(t, tf)}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
