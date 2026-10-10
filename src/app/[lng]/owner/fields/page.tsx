import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { Plus } from 'lucide-react';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import {
  OwnerFieldCard,
  type OwnerFieldCardLabels,
} from '@/components/owner/OwnerFieldCard';
import { toOwnerFieldItem, type OwnerFieldRow } from '@/lib/fields/owner';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('owner.meta') };
}

export default async function OwnerFieldsPage() {
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  let rows: OwnerFieldRow[] | null = null;
  try {
    const caller = await getServerCaller();
    rows = await caller.fieldOwner.list();
  } catch (error) {
    console.error('[OwnerFieldsPage]', error);
  }

  const labels: OwnerFieldCardLabels = {
    indoor: t('card.indoor'),
    outdoor: t('card.outdoor'),
    badgeApproved: t('owner.status.APPROVED'),
    badgePending: t('owner.status.PENDING'),
    badgeRejected: t('owner.status.REJECTED'),
    badgeArchived: t('owner.status.ARCHIVED'),
    pendingNote: t('owner.card.pendingNote'),
    archivedNote: t('owner.card.archivedNote'),
    rejectedReason: t('owner.card.rejectedReason'),
    view: t('owner.card.view'),
    availability: t('owner.card.availability'),
    edit: t('owner.card.edit'),
    resubmit: t('owner.card.resubmit'),
    archive: t('owner.card.archive'),
    confirmTitle: t('owner.archive.title'),
    confirmBody: t('owner.archive.body'),
    confirmAction: t('owner.archive.confirm'),
    cancel: t('owner.archive.cancel'),
    working: t('owner.archive.working'),
    blockedTitle: t('owner.archive.blockedTitle'),
    blockedOne: t('owner.archive.blockedOne'),
    blockedOther: t('owner.archive.blockedOther'),
    ok: t('owner.archive.ok'),
    errorGeneric: t('owner.archive.errorGeneric'),
  };

  const addLink = (
    <Link
      href={`/${lng}/owner/fields/new`}
      className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:px-5"
    >
      <Plus className="size-4" aria-hidden="true" />
      {t('new.cta')}
    </Link>
  );

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1>{t('owner.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('owner.subtitle')}</p>
          </div>
          {addLink}
        </div>

        <div className="mt-6 md:mt-8">
          {rows === null ? (
            <div className="rounded-xl border-[0.5px] border-border bg-card p-6 text-center">
              <h2 className="text-lg">{t('owner.error.title')}</h2>
              <p className="mt-1 text-muted-foreground">
                {t('owner.error.description')}
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border-[0.5px] border-border bg-card p-8 text-center">
              <h2 className="text-lg">{t('owner.empty.title')}</h2>
              <p className="mt-1 mb-4 text-muted-foreground">
                {t('owner.empty.description')}
              </p>
              {addLink}
            </div>
          ) : (
            <ul className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              {rows.map((row) => {
                const field = toOwnerFieldItem(row, lng);
                return (
                  <li key={field.id} className="min-w-0">
                    <OwnerFieldCard
                      lng={lng}
                      field={field}
                      sports={field.sports.map((value) => ({
                        value,
                        label: t(`sports.${value}`),
                      }))}
                      labels={labels}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
