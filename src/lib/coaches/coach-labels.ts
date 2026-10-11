import type { getT } from '@/i18n.server';
import type { CoachApprovalCardLabels } from '@/components/coaches/CoachApprovalCard';
import type { CoachApplyFormLabels } from '@/components/coaches/CoachApplyForm';
import type { CoachStatusBannerLabels } from '@/components/coaches/CoachStatusBanner';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildCoachFormLabels(
  t: Translate,
  action: { submit: string },
): CoachApplyFormLabels {
  return {
    sectionTitle: t('form.sectionTitle'),
    sport: t('form.sport'),
    area: t('form.area'),
    areaPlaceholder: t('form.areaPlaceholder'),
    bio: t('form.bio'),
    translationHint: t('form.translationHint'),
    rate: t('form.rate'),
    rateHint: t('form.rateHint'),
    certifications: t('form.certifications'),
    certificationsPlaceholder: t('form.certificationsPlaceholder'),
    submit: action.submit,
    submitting: t('form.submitting'),
    saved: t('form.saved'),
    errorRequired: t('form.errors.required'),
    errorSport: t('form.errors.sport'),
    errorRate: t('form.errors.rate'),
    errorGeneric: t('form.errors.generic'),
  };
}

export function buildCoachStatusLabels(t: Translate): {
  PENDING: CoachStatusBannerLabels;
  APPROVED: CoachStatusBannerLabels;
  REJECTED: CoachStatusBannerLabels;
} {
  const reason = t('status.reason');
  return {
    PENDING: {
      title: t('status.PENDING.title'),
      description: t('status.PENDING.description'),
      reason,
    },
    APPROVED: {
      title: t('status.APPROVED.title'),
      description: t('status.APPROVED.description'),
      reason,
    },
    REJECTED: {
      title: t('status.REJECTED.title'),
      description: t('status.REJECTED.description'),
      reason,
    },
  };
}

export function buildCoachApprovalLabels(
  t: Translate,
): CoachApprovalCardLabels {
  return {
    badgeApproved: t('admin.badge.APPROVED'),
    badgeRejected: t('admin.badge.REJECTED'),
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
}
