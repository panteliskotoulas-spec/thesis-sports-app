import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { CoachApprovalCard } from '@/components/coaches/CoachApprovalCard';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  COACH_STATUSES,
  DEFAULT_COACH_STATUS,
  formatRate,
  getInitials,
  parseCoachStatus,
  type CoachApprovalCardData,
} from '@/lib/coaches/coach';
import { buildCoachApprovalLabels } from '@/lib/coaches/coach-labels';
import { getMockCoachApprovalList } from '@/lib/coaches/coach-mock';
import { getCurrentUser } from '@/lib/session';

const TIME_ZONE = 'Europe/Athens';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('coaches');
  return { title: t('admin.meta') };
}

export default async function AdminCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);
  if (!user.isAdmin) notFound();

  const status = parseCoachStatus((await searchParams).status);
  const data = getMockCoachApprovalList(status);

  const basePath = `/${lng}/admin/coaches`;
  const dateFormatter = new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  });

  const cards: CoachApprovalCardData[] = data.coaches.map((row) => ({
    id: row.id,
    name: row.name,
    initials: getInitials(row.name),
    email: row.email,
    sport: { value: row.sportType, label: tf(`sports.${row.sportType}`) },
    rate: t('admin.card.rate', { rate: formatRate(row.hourlyRate, lng) }),
    bio: row.bio,
    certifications: row.certifications,
    submitted: t('admin.card.submitted', {
      date: dateFormatter.format(row.createdAt),
    }),
    status: row.status,
    rejectionReason: row.rejectionReason,
  }));

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <h1>{t('admin.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.subtitle')}</p>

        <nav
          aria-label={t('admin.tabsLabel')}
          className="mt-6 flex gap-2 overflow-x-auto"
        >
          {COACH_STATUSES.map((value) => {
            const active = value === status;

            return (
              <Link
                key={value}
                href={
                  value === DEFAULT_COACH_STATUS
                    ? basePath
                    : `${basePath}?status=${value}`
                }
                aria-current={active ? 'page' : undefined}
                className={`${chipBase} ${active ? chipOn : chipOff}`}
              >
                {t(`admin.status.${value}`)} {data.counts[value]}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          {cards.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t(`admin.empty.${status}.title`)}</h2>
              <p className="mt-2 text-muted-foreground">
                {t(`admin.empty.${status}.description`)}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              {cards.map((card) => (
                <CoachApprovalCard
                  key={card.id}
                  coach={card}
                  labels={buildCoachApprovalLabels(t)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
