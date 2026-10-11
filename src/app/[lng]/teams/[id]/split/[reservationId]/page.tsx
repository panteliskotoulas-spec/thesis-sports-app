import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TeamSplitPayment } from '@/components/teams/TeamSplitPayment';
import { getCurrentUser } from '@/lib/session';
import { buildTeamSplitPaymentLabels } from '@/lib/teams/team-labels';
import { getMockTeamSplitPayment } from '@/lib/teams/team-split-mock';
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
  const { id } = await params;
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  let data;
  try {
    data = await caller.teams.getById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }
  if (data.viewer.kind !== 'member') redirect(`/${lng}/teams/${id}`);

  const payment = getMockTeamSplitPayment(lng);
  const backHref = `/${lng}/teams/${id}`;

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
            fieldName={payment.fieldName}
            date={payment.date}
            time={payment.time}
            leaderName={payment.leaderName}
            share={payment.share}
            balance={payment.balance}
            backHref={backHref}
            labels={buildTeamSplitPaymentLabels(t, tf)}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
