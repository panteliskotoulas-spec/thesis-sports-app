import type { getT } from '@/i18n.server';
import type { NewFieldFormProps } from '@/components/fields/new/NewFieldForm';
import { MAX_IMAGE_MB, MAX_IMAGES } from '@/lib/fields/new-field';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildFieldFormLabels(
  t: Translate,
  action: { submit: string; submitting: string },
): NewFieldFormProps['labels'] {
  const limits = { max: MAX_IMAGES, size: MAX_IMAGE_MB };

  return {
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
    submit: action.submit,
    submitting: action.submitting,
    note: t('new.note'),
    errorRequired: t('new.errors.required'),
    errorLocation: t('new.errors.location'),
    errorCoordinates: t('new.errors.coordinates'),
    errorSports: t('new.errors.sports'),
    errorImages: t('new.errors.images'),
    errorGeneric: t('new.errors.generic'),
    location: {
      address: t('new.location.address'),
      hint: t('new.location.hint'),
      coordinates: t('new.location.coordinates'),
      coordinatesPlaceholder: t('new.location.coordinatesPlaceholder'),
      coordinatesHint: t('new.location.coordinatesHint'),
      find: t('new.location.find'),
      finding: t('new.location.finding'),
      found: t('new.location.found'),
      pick: t('new.location.pick'),
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
  };
}
