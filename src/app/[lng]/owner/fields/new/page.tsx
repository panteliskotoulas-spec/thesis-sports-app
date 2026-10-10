import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { NewFieldForm } from '@/components/fields/new/NewFieldForm';
import { MAX_IMAGE_MB, MAX_IMAGES } from '@/lib/fields/new-field';
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

  const limits = { max: MAX_IMAGES, size: MAX_IMAGE_MB };

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
            labels={{
              basicTitle: t('new.basic.title'),
              name: t('new.basic.name'),
              description: t('new.basic.description'),
              area: t('new.basic.area'),
              areaPlaceholder: t('new.basic.areaPlaceholder'),
              locationTitle: t('new.location.title'),
              featuresTitle: t('new.features.title'),
              type: t('new.features.type'),
              indoor: t('card.indoor'),
              outdoor: t('card.outdoor'),
              sports: t('new.features.sports'),
              photosTitle: t('new.photos.title'),
              submit: t('new.submit'),
              submitting: t('new.submitting'),
              note: t('new.note'),
              errorRequired: t('new.errors.required'),
              errorLocation: t('new.errors.location'),
              errorSports: t('new.errors.sports'),
              errorImages: t('new.errors.images'),
              errorGeneric: t('new.errors.generic'),
              location: {
                address: t('new.location.address'),
                find: t('new.location.find'),
                finding: t('new.location.finding'),
                found: t('new.location.found'),
                notFound: t('new.location.notFound'),
                openMaps: t('detail.location.open'),
                attribution: t('new.location.attribution'),
              },
              photos: {
                add: t('new.photos.add'),
                cover: t('new.photos.cover'),
                makeCover: t('new.photos.makeCover'),
                remove: t('new.photos.remove'),
                photo: t('new.photos.photo'),
                hint: t('new.photos.hint', limits),
                errorType: t('new.photos.errorType'),
                errorSize: t('new.photos.errorSize', limits),
                errorMax: t('new.photos.errorMax', limits),
              },
            }}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
