import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { getT } from '@/i18n.server';
import { CoachApplyForm } from '@/components/coaches/CoachApplyForm';
import { CoachStatusBanner } from '@/components/coaches/CoachStatusBanner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import type { CoachFormInitial } from '@/lib/coaches/coach';
import {
  buildCoachFormLabels,
  buildCoachStatusLabels,
} from '@/lib/coaches/coach-labels';
import { SPORT_TYPES } from '@/lib/fields/types';
import { localized } from '@/lib/i18n-content';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('meta.apply') };
}

export default async function CoachApplyPage() {
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const record = await caller.coaches.getMine();

  const status = record?.status ?? null;
  const rejectionReason = record?.rejectionReason
    ? localized(record.rejectionReason, lng)
    : null;
  const initial: CoachFormInitial | undefined = record
    ? {
        sportType: record.sportType,
        bio: localized(record.bio, lng),
        hourlyRate: String(record.hourlyRate),
        certifications: record.certifications ?? '',
      }
    : undefined;

  const statusLabels = buildCoachStatusLabels(t);

  const submit =
    status === null
      ? t('form.submitCreate')
      : status === 'REJECTED'
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

        {status ? (
          <div className="mt-6">
            <CoachStatusBanner
              status={status}
              rejectionReason={rejectionReason}
              labels={statusLabels[status]}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('apply.reviewNote')}
          </p>
        )}

        {status === 'APPROVED' ? (
          <Link
            href={`/${lng}/coaches/slots`}
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full border-[0.5px] border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <CalendarClock className="size-4" aria-hidden="true" />
            {t('apply.manageSlots')}
          </Link>
        ) : null}

        <div className="mt-6">
          <CoachApplyForm
            lng={lng}
            initial={initial}
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
