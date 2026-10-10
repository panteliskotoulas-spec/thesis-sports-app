import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { NewFieldForm } from '@/components/fields/new/NewFieldForm';
import { buildFieldFormLabels } from '@/lib/fields/form-labels';
import { SPORT_TYPES } from '@/lib/fields/types';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('fields');
  return { title: t('new.meta') };
}

export default async function NewFieldPage() {
  const { t } = await getT('fields');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('new.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('new.subtitle')}</p>

        <div className="mt-6 md:mt-8">
          <NewFieldForm
            lng={lng}
            sports={SPORT_TYPES.map((value) => ({
              value,
              label: t(`sports.${value}`),
            }))}
            labels={buildFieldFormLabels(t, {
              submit: t('new.submit'),
              submitting: t('new.submitting'),
            })}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
