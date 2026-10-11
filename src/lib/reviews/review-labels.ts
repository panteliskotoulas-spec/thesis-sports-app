import type { getT } from '@/i18n.server';
import type { ReviewFormLabels } from '@/components/reviews/ReviewForm';
import type { ReviewsSectionLabels } from '@/components/reviews/ReviewsSection';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildReviewFormLabels(tr: Translate): ReviewFormLabels {
  return {
    prompt: tr('form.prompt'),
    commentLabel: tr('form.commentLabel'),
    commentPlaceholder: tr('form.commentPlaceholder'),
    counter: tr('form.counter'),
    submit: tr('form.submit'),
    submitting: tr('form.submitting'),
    cancel: tr('form.cancel'),
    errorRating: tr('form.errorRating'),
    errorConflict: tr('form.errorConflict'),
    errorForbidden: tr('form.errorForbidden'),
    errorGeneric: tr('form.errorGeneric'),
    rating: {
      legend: tr('form.legend'),
      star: tr('form.star'),
      choose: tr('form.choose'),
      names: [
        tr('form.rating1'),
        tr('form.rating2'),
        tr('form.rating3'),
        tr('form.rating4'),
        tr('form.rating5'),
      ],
    },
  };
}

export function buildReviewsSectionLabels(tr: Translate): ReviewsSectionLabels {
  return {
    title: tr('title'),
    countOne: tr('countOne'),
    countOther: tr('countOther'),
    empty: tr('empty'),
    more: tr('more'),
    loading: tr('loading'),
    loadError: tr('loadError'),
    stars: tr('stars'),
  };
}
