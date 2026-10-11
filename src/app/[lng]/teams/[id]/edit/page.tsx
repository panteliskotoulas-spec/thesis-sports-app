import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { NewTeamForm } from '@/components/teams/NewTeamForm';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';
import { TEAM_LEVELS, toTeamDetailItem } from '@/lib/teams/team';
import { buildTeamFormLabels } from '@/lib/teams/team-labels';
import { getMockTeamDetail } from '@/lib/teams/team-mock';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('meta.edit') };
}

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getT('teams');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const row = getMockTeamDetail(id);
  if (!row) notFound();
  const team = toTeamDetailItem(row, lng);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/teams/${team.id}/manage`}
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('edit.back')}
        </Link>

        <h1 className="mt-2">{t('edit.title')}</h1>

        <div className="mt-6">
          <NewTeamForm
            lng={lng}
            initial={{
              id: team.id,
              name: team.name,
              sportType: team.sportType,
              level: team.level,
              area: team.area,
              description: team.description ?? '',
              maxMembers: team.maxMembers,
              isRecruiting: team.isRecruiting,
              neededPosition: team.neededPosition ?? '',
              logoUrl: team.logoUrl,
              memberCount: team.memberCount,
            }}
            takenSports={[]}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: tf(`sports.${value}`),
            }))}
            levels={TEAM_LEVELS.map((value) => ({
              value,
              label: t(`levels.${value}`),
            }))}
            labels={buildTeamFormLabels(t, {
              submit: t('form.submitSave'),
              submitting: t('form.submitSaving'),
            })}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
