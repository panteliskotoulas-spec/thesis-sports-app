import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ExternalLink, Home, MapPin, Star, Sun } from 'lucide-react';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { FieldAvailability } from '@/components/fields/FieldAvailability';
import { FieldGallery } from '@/components/fields/FieldGallery';
import { FieldReviews } from '@/components/fields/FieldReviews';
import { parseDetailDate, toFieldDetail } from '@/lib/fields/detail';
import { buildMapsUrl } from '@/lib/fields/detail-format';
import type { SearchParams } from '@/lib/fields/filters';
import { formatRating } from '@/lib/fields/format';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

interface FieldPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}

const loadField = cache(async (id: string, date: string | null) => {
  try {
    const caller = await getServerCaller();
    return await caller.fields.getById({ id, date });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
  searchParams,
}: FieldPageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await loadField(id, parseDetailDate(await searchParams));
  if (!row) return {};
  const lng = await routeLanguage();
  return { title: toFieldDetail(row, lng).name };
}

export default async function FieldPage({
  params,
  searchParams,
}: FieldPageProps) {
  const { id } = await params;
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  const row = await loadField(id, parseDetailDate(await searchParams));
  if (!row) notFound();
  const field = toFieldDetail(row, lng);

  const slideLabels = field.images.map((_, position) =>
    t('detail.gallery.slide', {
      current: position + 1,
      total: field.images.length,
    }),
  );

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <FieldGallery
          images={field.images}
          alt={field.name}
          previousLabel={t('detail.gallery.previous')}
          nextLabel={t('detail.gallery.next')}
          slideLabels={slideLabels}
        />

        <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            <h1>{field.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {field.area}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {field.indoor ? (
                  <Home className="size-3.5" aria-hidden="true" />
                ) : (
                  <Sun className="size-3.5" aria-hidden="true" />
                )}
                {field.indoor ? t('card.indoor') : t('card.outdoor')}
              </span>
              {field.rating ? (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star
                    className="size-3.5 fill-terracotta text-terracotta"
                    aria-hidden="true"
                  />
                  <strong>{formatRating(field.rating.average, lng)}</strong>
                  <span className="text-muted-foreground">
                    ({field.rating.count})
                  </span>
                </span>
              ) : (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {t('card.new')}
                </span>
              )}
              {field.sports.map((sport) => (
                <span
                  key={sport}
                  className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                >
                  {t(`sports.${sport}`)}
                </span>
              ))}
            </div>

            {field.businessName ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t('detail.managedBy', { name: field.businessName })}
              </p>
            ) : null}

            <section className="mt-6" aria-labelledby="description-title">
              <h2 id="description-title" className="text-lg">
                {t('detail.description')}
              </h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {field.description}
              </p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <FieldAvailability field={field} />
          </aside>

          <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-2">
            <section aria-labelledby="location-title">
              <h2 id="location-title" className="text-lg">
                {t('detail.location.title')}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {field.address}
              </p>
              <a
                href={buildMapsUrl(field.latitude, field.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {t('detail.location.open')}
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </section>

            <FieldReviews field={field} />
          </div>
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
