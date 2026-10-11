import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { CoachApplyForm } from '@/components/coaches/CoachApplyForm';
import { CoachStatusBanner } from '@/components/coaches/CoachStatusBanner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  buildCoachFormLabels,
  buildCoachStatusLabels,
} from '@/lib/coaches/coach-labels';
import {
  getMockCoachApplication,
  parseMockCoachState,
} from '@/lib/coaches/coach-mock';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('meta.apply') };
}

export default async function CoachApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const state = parseMockCoachState((await searchParams).state);
  const application = getMockCoachApplication(state);
  const statusLabels = buildCoachStatusLabels(t);

  const submit =
    application.status === null
      ? t('form.submitCreate')
      : application.status === 'REJECTED'
        ? t('form.submitResubmit')
        : t('form.submitUpdate');

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/coaches`}
          className="inline-flex h-10 items-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('apply.back')}
        </Link>

        <h1 className="mt-2">{t('apply.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('apply.subtitle')}</p>

        {application.status ? (
          <div className="mt-6">
            <CoachStatusBanner
              status={application.status}
              rejectionReason={application.rejectionReason}
              labels={statusLabels[application.status]}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('apply.reviewNote')}
          </p>
        )}

        <div className="mt-6">
          <CoachApplyForm
            key={state}
            initial={application.initial}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            labels={buildCoachFormLabels(t, { submit })}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
