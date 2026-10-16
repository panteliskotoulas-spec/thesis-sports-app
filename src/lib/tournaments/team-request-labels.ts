import type { getT } from '@/i18n.server';
import type { TeamRequestCardLabels } from '@/components/tournaments/TeamRequestCard';
import type { AdminRequestsSectionLabels } from '@/components/admin/tournaments/AdminRequestsSection';
import type { AdminErrorLabels } from './admin';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildTeamRequestCardLabels(
  t: Translate,
): TeamRequestCardLabels {
  return {
    title: t('requests.title'),
    teamLabel: t('requests.teamLabel'),
    apply: t('requests.apply'),
    applying: t('requests.applying'),
    openNote: t('requests.openNote'),
    fullNote: t('requests.fullNote'),
    pendingBadge: t('requests.pendingBadge'),
    cancel: t('requests.cancel'),
    cancelling: t('requests.cancelling'),
    rejectedBadge: t('requests.rejectedBadge'),
    rejectedNote: t('requests.rejectedNote'),
    errorConflict: t('requests.errorConflict'),
    errorGeneric: t('requests.errorGeneric'),
  };
}

export function buildAdminRequestsLabels(
  t: Translate,
  errors: AdminErrorLabels,
): AdminRequestsSectionLabels {
  return {
    title: t('admin.requests.title'),
    empty: t('admin.requests.empty'),
    accept: t('admin.requests.accept'),
    accepting: t('admin.requests.accepting'),
    reject: t('admin.requests.reject'),
    rejecting: t('admin.requests.rejecting'),
    rejectConfirm: t('admin.requests.rejectConfirm'),
    rejectYes: t('admin.requests.rejectYes'),
    rejectNo: t('admin.requests.rejectNo'),
    acceptAria: t('admin.requests.acceptAria'),
    rejectAria: t('admin.requests.rejectAria'),
    lockedNote: t('admin.requests.lockedNote'),
    fullNote: t('admin.requests.fullNote'),
    pendingCount: t('admin.requests.pendingCount'),
    rejectedSummary: t('admin.requests.rejectedSummary'),
    rejectedBadge: t('admin.requests.rejectedBadge'),
    errors,
  };
}
