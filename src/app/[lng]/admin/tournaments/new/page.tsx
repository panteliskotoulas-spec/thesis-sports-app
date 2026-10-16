import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import {
  TournamentForm,
  type TournamentFormLabels,
} from '@/components/admin/tournaments/TournamentForm';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { DESCRIPTION_MAX, MAX_TEAMS, MIN_TEAMS } from '@/lib/tournaments/admin';
import { buildAdminErrorLabels } from '@/lib/tournaments/admin-labels';
import { loadFieldOptions } from '@/lib/tournaments/admin-loader';
import { getCurrentUser } from '@/lib/session';
import { TOURNAMENT_SPORTS } from '@/lib/tournaments/tournament';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('tournaments');
  return { title: t('admin.form.metaNew') };
}

export default async function NewTournamentPage() {
  const { t } = await getT('tournaments');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);
  if (!user.isAdmin) notFound();

  const fields = await loadFieldOptions(lng);

  const labels: TournamentFormLabels = {
    name: t('admin.form.name'),
    sport: t('admin.form.sport'),
    sportLocked: t('admin.form.sportLocked'),
    field: t('admin.form.field'),
    fieldPlaceholder: t('admin.form.fieldPlaceholder'),
    fieldPickSport: t('admin.form.fieldPickSport'),
    fieldNone: t('admin.form.fieldNone'),
    startDay: t('admin.form.startDay'),
    endDay: t('admin.form.endDay'),
    maxTeams: t('admin.form.maxTeams'),
    maxTeamsHint: t('admin.form.maxTeamsHint', {
      min: MIN_TEAMS,
      max: MAX_TEAMS,
    }),
    description: t('admin.form.description'),
    descriptionHint: t('admin.form.descriptionHint', { max: DESCRIPTION_MAX }),
    submit: t('admin.form.submitCreate'),
    submitting: t('admin.form.submitting'),
    errorName: t('admin.form.errorName'),
    errorSport: t('admin.form.errorSport'),
    errorField: t('admin.form.errorField'),
    errorDates: t('admin.form.errorDates'),
    errorMaxTeams: t('admin.form.errorMaxTeams', {
      min: MIN_TEAMS,
      max: MAX_TEAMS,
    }),
    errorDescription: t('admin.form.errorDescription', {
      max: DESCRIPTION_MAX,
    }),
    errors: buildAdminErrorLabels(t),
  };

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/admin/tournaments`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('admin.back')}
        </Link>

        <h1 className="mt-4">{t('admin.form.titleNew')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('admin.form.subtitleNew')}
        </p>

        <div className="mt-6 md:mt-8">
          <TournamentForm
            lng={lng}
            sports={TOURNAMENT_SPORTS.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            fields={fields}
            labels={labels}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
