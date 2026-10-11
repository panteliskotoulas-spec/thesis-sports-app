import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft, Award, MapPin, Star } from 'lucide-react';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { CoachAvailability } from '@/components/coaches/CoachAvailability';
import { CoachReviewsSection } from '@/components/coaches/CoachReviewsSection';
import { toCoachDetail } from '@/lib/coaches/coach-public';
import { parseDetailDate } from '@/lib/fields/detail';
import { formatRating } from '@/lib/fields/format';
import type { SearchParams } from '@/lib/fields/filters';
import { REVIEW_PAGE_SIZE, type ReviewPage } from '@/lib/reviews/review';
import { buildReviewsSectionLabels } from '@/lib/reviews/review-labels';
import { getCurrentUser } from '@/lib/session';
import type { TeamBookingOption } from '@/lib/teams/team-booking';
import { getServerCaller } from '@/trpc/server/caller';

interface CoachPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}

const loadCoach = cache(async (id: string, date: string | null) => {
  try {
    const caller = await getServerCaller();
    return await caller.coaches.getById({ id, date });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
  searchParams,
}: CoachPageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await loadCoach(id, parseDetailDate(await searchParams));
  return row ? { title: row.name } : {};
}

export default async function CoachPage({
  params,
  searchParams,
}: CoachPageProps) {
  const { id } = await params;
  const { t } = await getT('coaches');
  const { t: tf } = await getT('fields');
  const { t: tr } = await getT('reviews');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  const row = await loadCoach(id, parseDetailDate(await searchParams));
  if (!row) notFound();
  const coach = toCoachDetail(row, lng);

  const rating = coach.rating;

  let reviews: ReviewPage = { items: [], total: 0, rating };
  try {
    const caller = await getServerCaller();
    reviews = await caller.coachReviews.list({
      coachId: coach.id,
      offset: 0,
      limit: REVIEW_PAGE_SIZE,
    });
  } catch (error) {
    console.error('[CoachPage] reviews', error);
  }

  let teams: TeamBookingOption[] = [];
  if (user && !coach.isSelf) {
    try {
      const caller = await getServerCaller();
      teams = await caller.teams.bookableTeams({ sportType: coach.sportType });
    } catch (error) {
      console.error('[CoachPage] bookableTeams', error);
    }
  }

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <Link
          href={`/${lng}/coaches`}
          className="mb-2 inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('detail.back')}
        </Link>

        <div className="mt-2 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex size-18 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-medium text-accent-foreground"
              >
                {coach.initials}
              </span>
              <div className="min-w-0">
                <h1>{coach.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                    {tf(`sports.${coach.sportType}`)}
                  </span>
                  {rating ? (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Star
                        className="size-3.5 fill-terracotta text-terracotta"
                        aria-hidden="true"
                      />
                      <strong>{formatRating(rating.average, lng)}</strong>
                      <span className="text-muted-foreground">
                        ({rating.count})
                      </span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {tr('new')}
                    </span>
                  )}
                  {coach.area ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {coach.area}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <section className="mt-6" aria-labelledby="coach-about-title">
              <h2 id="coach-about-title" className="text-lg">
                {t('detail.about')}
              </h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {coach.bio}
              </p>
            </section>

            {coach.certifications ? (
              <section className="mt-6" aria-labelledby="coach-certs-title">
                <h2 id="coach-certs-title" className="text-lg">
                  {t('detail.certifications')}
                </h2>
                <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
                  <Award
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {coach.certifications}
                </p>
              </section>
            ) : null}

            <div className="mt-6">
              <CoachReviewsSection
                coachId={coach.id}
                lng={lng}
                rating={reviews.rating}
                items={reviews.items}
                total={reviews.total}
                pageSize={REVIEW_PAGE_SIZE}
                labels={buildReviewsSectionLabels(tr)}
              />
            </div>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-24">
            <CoachAvailability
              coach={coach}
              teams={teams}
              loginHref={user ? null : `/${lng}/login`}
            />
          </aside>
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
