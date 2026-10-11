import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { TeamManage } from '@/components/teams/TeamManage';
import { getCurrentUser } from '@/lib/session';
import { toJoinRequestItem } from '@/lib/teams/team';
import { buildTeamManageLabels } from '@/lib/teams/team-labels';
import { getMockJoinRequests, getMockTeamDetail } from '@/lib/teams/team-mock';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('teams');
  return { title: t('meta.manage') };
}

export default async function ManageTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getT('teams');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const row = getMockTeamDetail(id);
  if (!row) notFound();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={`/${lng}/teams/${row.id}`}
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('manage.back')}
        </Link>

        <h1 className="mt-2 wrap-break-word">{row.name}</h1>
        <p className="mt-2 text-muted-foreground">{t('manage.title')}</p>

        <div className="mt-6">
          <TeamManage
            teamId={row.id}
            lng={lng}
            nowIso={new Date().toISOString()}
            maxMembers={row.maxMembers}
            currentUserId="user-1"
            requests={getMockJoinRequests().map(toJoinRequestItem)}
            members={row.members.map((member) => ({
              userId: member.userId,
              name: member.name,
              avatarUrl: member.avatarUrl,
              role: member.role,
            }))}
            labels={buildTeamManageLabels(t)}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
