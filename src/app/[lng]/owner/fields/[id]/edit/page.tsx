import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { TRPCError } from '@trpc/server';
import { getT } from '@/i18n.server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { NewFieldForm } from '@/components/fields/new/NewFieldForm';
import { buildFieldFormLabels } from '@/lib/fields/form-labels';
import type { OwnerFieldEditRow } from '@/lib/fields/owner';
import { SPORT_TYPES } from '@/lib/fields/types';
import { localized } from '@/lib/i18n-content';
import { getCurrentUser } from '@/lib/session';
import { getServerCaller } from '@/trpc/server/caller';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('owner.edit.meta') };
}

export default async function EditFieldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  let field: OwnerFieldEditRow;
  try {
    const caller = await getServerCaller();
    field = await caller.fieldOwner.getForEdit({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const rejected = field.status === 'REJECTED';
  const reason = field.rejectionReason
    ? localized(field.rejectionReason, lng)
    : '';
  const notice = rejected
    ? t('owner.edit.noticeRejected')
    : field.status === 'APPROVED'
      ? t('owner.edit.noticeApproved')
      : undefined;

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>
          {rejected ? t('owner.edit.titleRejected') : t('owner.edit.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('owner.edit.subtitle')}</p>

        {rejected && reason ? (
          <div className="mt-4 rounded-xl border-[0.5px] border-border bg-card px-4 py-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {t('owner.card.rejectedReason')}
            </h2>
            <p className="mt-1 whitespace-pre-line text-foreground">{reason}</p>
          </div>
        ) : null}

        <div className="mt-6 md:mt-8">
          <NewFieldForm
            lng={lng}
            notice={notice}
            initial={{
              id: field.id,
              name: localized(field.name, lng),
              description: localized(field.description, lng),
              area: localized(field.area, lng),
              address: field.address,
              latitude: field.latitude,
              longitude: field.longitude,
              indoor: field.indoor,
              sports: field.sports,
              images: field.images,
            }}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: t(`sports.${value}`),
            }))}
            labels={buildFieldFormLabels(t, {
              submit: rejected
                ? t('owner.edit.resubmit')
                : t('owner.edit.save'),
              submitting: t('owner.edit.saving'),
            })}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
