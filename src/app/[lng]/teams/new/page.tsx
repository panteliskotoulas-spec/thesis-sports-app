import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { NewTeamForm } from '@/components/teams/NewTeamForm';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';
import { TEAM_LEVELS } from '@/lib/teams/team';
import { buildTeamFormLabels } from '@/lib/teams/team-labels';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('meta.new') };
}

export default async function NewTeamPage() {
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const caller = await getServerCaller();
  const takenSports = await caller.teams.takenSports();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('new.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('new.subtitle')}</p>

        <div className="mt-6">
          <NewTeamForm
            lng={lng}
            takenSports={takenSports}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            levels={TEAM_LEVELS.map((value) => ({
              value,
              label: t(`levels.${value}`),
            }))}
            labels={buildTeamFormLabels(t, {
              submit: t('form.submitCreate'),
              submitting: t('form.submitCreating'),
            })}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
