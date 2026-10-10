import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import {
  AdminFieldCard,
  type AdminFieldCardData,
  type AdminFieldCardLabels,
} from '@/components/admin/AdminFieldCard';
import { chipBase, chipOff, chipOn } from '@/components/fields/chipStyles';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  DEFAULT_FIELD_STATUS,
  FIELD_STATUSES,
  parseFieldStatus,
  toFieldApprovalItem,
  type FieldApprovalList,
} from '@/lib/fields/approval';
import { buildMapsUrl } from '@/lib/fields/detail-format';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

const TIME_ZONE = 'Europe/Athens';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('admin.meta') };
}

export default async function AdminFieldsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);
  if (!user.isAdmin) notFound();

  const status = parseFieldStatus((await searchParams).status);

  let data: FieldApprovalList | null = null;
  try {
    const caller = await getServerCaller();
    data = await caller.fieldApproval.list({ status });
  } catch (error) {
    console.error('[AdminFieldsPage]', error);
  }

  const basePath = `/${lng}/admin/fields`;
  const dateFormatter = new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'short',
    timeZone: TIME_ZONE,
  });

  const labels: AdminFieldCardLabels = {
    indoor: t('card.indoor'),
    outdoor: t('card.outdoor'),
    badgeApproved: t('admin.badge.APPROVED'),
    badgeRejected: t('admin.badge.REJECTED'),
    details: t('admin.card.details'),
    description: t('admin.card.description'),
    address: t('admin.card.address'),
    openMaps: t('detail.location.open'),
    photosTitle: t('admin.card.photosTitle'),
    noPhotos: t('admin.card.noPhotos'),
    photo: t('new.photos.photo'),
    approve: t('admin.actions.approve'),
    reject: t('admin.actions.reject'),
    confirmReject: t('admin.actions.confirmReject'),
    cancel: t('admin.actions.cancel'),
    reasonLabel: t('admin.actions.reasonLabel'),
    reasonPlaceholder: t('admin.actions.reasonPlaceholder'),
    reasonHint: t('admin.actions.reasonHint'),
    rejectedReason: t('admin.actions.rejectedReason'),
    working: t('admin.actions.working'),
    errorGeneric: t('admin.actions.errorGeneric'),
  };

  const cards: AdminFieldCardData[] = (data?.fields ?? []).map((row) => {
    const item = toFieldApprovalItem(row, lng);
    const ownerName = item.owner.business
      ? (item.owner.businessName ?? item.owner.name)
      : item.owner.name;
    const ownerKind = item.owner.business
      ? t('admin.card.business')
      : t('admin.card.individual');

    return {
      id: item.id,
      name: item.name,
      area: item.area,
      description: item.description,
      address: item.address,
      mapsUrl: buildMapsUrl(item.latitude, item.longitude),
      indoor: item.indoor,
      sports: item.sports.map((value) => ({
        value,
        label: t(`sports.${value}`),
      })),
      ownerLine: `${ownerName} · ${ownerKind}`,
      submitted: t('admin.card.submitted', {
        date: dateFormatter.format(item.createdAt),
      }),
      photosCount: t('admin.card.photos', { count: item.images.length }),
      images: item.images,
      status: item.status,
      rejectionReason: item.rejectionReason,
    };
  });

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
          {FIELD_STATUSES.map((value) => {
            const active = value === status;
            const count = data?.counts[value];

            return (
              <Link
                key={value}
                href={
                  value === DEFAULT_FIELD_STATUS
                    ? basePath
                    : `${basePath}?status=${value}`
                }
                aria-current={active ? 'page' : undefined}
                className={`${chipBase} ${active ? chipOn : chipOff}`}
              >
                {t(`admin.status.${value}`)}
                {count !== undefined ? ` ${count}` : ''}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          {data === null ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('admin.error.title')}</h2>
              <p className="mt-2 text-muted-foreground">
                {t('admin.error.description')}
              </p>
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t(`admin.empty.${status}.title`)}</h2>
              <p className="mt-2 text-muted-foreground">
                {t(`admin.empty.${status}.description`)}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              {cards.map((card) => (
                <AdminFieldCard
                  key={card.id}
                  lng={lng}
                  field={card}
                  labels={labels}
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
