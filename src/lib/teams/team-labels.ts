import type { getT } from '@/i18n.server';
import type { TeamBookingLabels } from '@/components/bookings/TeamBookingSelect';
import type { TeamFormLabels } from '@/components/teams/NewTeamForm';
import type { TeamJoinLabels } from '@/components/teams/TeamJoinButton';
import type { TeamManageLabels } from '@/components/teams/TeamManage';
import type { TeamReservationsLabels } from '@/components/teams/TeamReservations';
import type { TeamSplitLabels } from '@/components/teams/TeamSplitProgress';
import type { TeamSplitPaymentLabels } from '@/components/teams/TeamSplitPayment';
import { MAX_IMAGE_MB } from '@/lib/fields/new-field';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildTeamFormLabels(
  t: Translate,
  action: { submit: string; submitting: string },
): TeamFormLabels {
  const limits = { size: MAX_IMAGE_MB };

  return {
    basicTitle: t('form.basicTitle'),
    membersTitle: t('form.membersTitle'),
    name: t('form.name'),
    sport: t('form.sport'),
    sportLockedHint: t('form.sportLockedHint'),
    sportTakenHint: t('form.sportTakenHint'),
    level: t('form.level'),
    area: t('form.area'),
    areaPlaceholder: t('form.areaPlaceholder'),
    translationHint: t('form.translationHint'),
    description: t('form.description'),
    maxMembers: t('form.maxMembers'),
    maxMembersHint: t('form.maxMembersHint'),
    increase: t('form.increase'),
    decrease: t('form.decrease'),
    recruiting: t('form.recruiting'),
    recruitingHint: t('form.recruitingHint'),
    neededPosition: t('form.neededPosition'),
    neededPositionPlaceholder: t('form.neededPositionPlaceholder'),
    submit: action.submit,
    submitting: action.submitting,
    errorRequired: t('form.errors.required'),
    errorSport: t('form.errors.sport'),
    errorMembers: t('form.errors.members'),
    errorGeneric: t('form.errors.generic'),
    logo: {
      add: t('form.logo.add'),
      change: t('form.logo.change'),
      remove: t('form.logo.remove'),
      hint: t('form.logo.hint', limits),
      errorType: t('form.logo.errorType'),
      errorSize: t('form.logo.errorSize', limits),
    },
  };
}

export function buildTeamJoinLabels(t: Translate): TeamJoinLabels {
  return {
    login: t('join.login'),
    join: t('join.join'),
    joining: t('join.joining'),
    cancelRequest: t('join.cancelRequest'),
    cancelling: t('join.cancelling'),
    leave: t('join.leave'),
    leaveTitle: t('join.leaveTitle'),
    leaveBody: t('join.leaveBody'),
    leaveConfirm: t('join.leaveConfirm'),
    leaveBack: t('join.leaveBack'),
    leaving: t('join.leaving'),
    manage: t('join.manage'),
    full: t('join.full'),
    sportTaken: t('join.sportTaken'),
    errorConflict: t('join.errorConflict'),
    errorGeneric: t('join.errorGeneric'),
  };
}

export function buildTeamManageLabels(t: Translate): TeamManageLabels {
  return {
    requestsTitle: t('manage.requestsTitle'),
    requestsEmpty: t('manage.requestsEmpty'),
    requestsFull: t('manage.requestsFull'),
    accept: t('manage.accept'),
    reject: t('manage.reject'),
    membersTitle: t('manage.membersTitle'),
    leader: t('manage.leader'),
    leaderYou: t('manage.leaderYou'),
    menuLabel: t('manage.menuLabel'),
    transfer: t('manage.transfer'),
    remove: t('manage.remove'),
    confirmTransferTitle: t('manage.confirm.transferTitle'),
    confirmTransferBody: t('manage.confirm.transferBody'),
    confirmTransferAction: t('manage.confirm.transferAction'),
    confirmRemoveTitle: t('manage.confirm.removeTitle'),
    confirmRemoveBody: t('manage.confirm.removeBody'),
    confirmRemoveAction: t('manage.confirm.removeAction'),
    confirmDeleteTitle: t('manage.confirm.deleteTitle'),
    confirmDeleteBody: t('manage.confirm.deleteBody'),
    confirmDeleteAction: t('manage.confirm.deleteAction'),
    confirmBack: t('manage.confirm.back'),
    working: t('manage.confirm.working'),
    infoTitle: t('manage.infoTitle'),
    infoBody: t('manage.infoBody'),
    edit: t('manage.edit'),
    leaveTitle: t('manage.leaveTitle'),
    leaveBody: t('manage.leaveBody'),
    deleteAction: t('manage.deleteAction'),
    justNow: t('manage.justNow'),
    errorConflict: t('manage.errorConflict'),
    errorGeneric: t('manage.errorGeneric'),
  };
}

export function buildTeamBookingLabels(t: Translate): TeamBookingLabels {
  return {
    title: t('booking.title'),
    me: t('booking.me'),
    members: t('booking.members'),
    note: t('booking.note'),
    hint: t('booking.hint'),
  };
}

export function buildTeamReservationsLabels(
  t: Translate,
): TeamReservationsLabels {
  return {
    title: t('reservations.title'),
    empty: t('reservations.empty'),
    confirmed: t('reservations.confirmed'),
    bookedBy: t('reservations.bookedBy'),
    split: buildTeamSplitLabels(t),
  };
}

export function buildTeamSplitLabels(t: Translate): TeamSplitLabels {
  return {
    title: t('split.title'),
    progress: t('split.progress'),
    collected: t('split.collected'),
    paid: t('split.paid'),
    pending: t('split.pending'),
    leaderNote: t('split.leaderNote'),
    yourShare: t('split.yourShare'),
    toLeader: t('split.toLeader'),
    pay: t('split.pay'),
    youPaid: t('split.youPaid'),
  };
}

export function buildTeamSplitPaymentLabels(
  t: Translate,
  tf: Translate,
): TeamSplitPaymentLabels {
  return {
    credit: {
      title: tf('booking.summary.credit.title'),
      available: tf('booking.summary.credit.available'),
      none: tf('booking.summary.credit.none'),
      toggle: tf('booking.summary.credit.toggle'),
      limited: tf('booking.summary.credit.limited'),
    },
    shareLabel: t('splitPay.shareLabel'),
    creditRow: tf('booking.summary.creditRow'),
    cardRow: tf('booking.summary.cardRow'),
    totalRow: tf('booking.summary.totalRow'),
    payCard: tf('booking.summary.payCard'),
    confirm: t('splitPay.confirm'),
    working: tf('booking.summary.working'),
    stripeNote: tf('booking.summary.stripeNote'),
    refundNote: t('splitPay.refundNote'),
    errorMinimum: tf('booking.summary.errorMinimum'),
    errorGeneric: tf('booking.summary.errorGeneric'),
  };
}
