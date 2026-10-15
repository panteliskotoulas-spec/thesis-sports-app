import type { getT } from '@/i18n.server';
import type { CoachSlotRequestLabels } from '@/components/coaches/CoachSlotRequest';
import type { CoachRequestsListLabels } from '@/components/coaches/requests/CoachRequestsList';
import type { CoachSessionsListLabels } from '@/components/coaches/sessions/CoachSessionsList';
import { buildOpenChatLabels } from '@/lib/chat/chat-labels';
import { buildReviewFormLabels } from '@/lib/reviews/review-labels';
import {
  buildTeamBookingLabels,
  buildTeamSplitLabels,
} from '@/lib/teams/team-labels';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildCoachSlotRequestLabels(
  t: Translate,
  tt: Translate,
): CoachSlotRequestLabels {
  return {
    heading: t('detail.availability.slots'),
    perSession: t('detail.availability.perSession'),
    request: t('detail.availability.request'),
    pending: t('detail.request.pending'),
    panelTitle: t('detail.request.panelTitle'),
    priceRow: t('detail.request.priceRow'),
    payNote: t('detail.request.payNote'),
    send: t('detail.request.send'),
    sending: t('detail.request.sending'),
    cancel: t('detail.request.cancel'),
    sent: t('detail.request.sent'),
    errorConflict: t('detail.request.errorConflict'),
    errorGeneric: t('detail.request.errorGeneric'),
    team: buildTeamBookingLabels(tt),
  };
}

export function buildCoachRequestsLabels(
  t: Translate,
  tc: Translate,
): CoachRequestsListLabels {
  return {
    tabPending: t('requests.tabPending'),
    tabAccepted: t('requests.tabAccepted'),
    tabRejected: t('requests.tabRejected'),
    empty: t('requests.empty'),
    acceptedNotice: t('requests.acceptedNotice'),
    rejectedNotice: t('requests.rejectedNotice'),
    errorConflict: t('requests.errorConflict'),
    cancelledNotice: t('requests.cancelledNotice'),
    errorGeneric: t('requests.errorGeneric'),
    card: {
      individual: t('requests.card.individual'),
      accept: t('requests.card.accept'),
      reject: t('requests.card.reject'),
      working: t('requests.card.working'),
      paid: t('requests.card.paid'),
      awaitingPayment: t('requests.card.awaitingPayment'),
      paymentExpired: t('requests.card.paymentExpired'),
      cancel: t('requests.card.cancel'),
      panelTitle: t('requests.card.panelTitle'),
      panelBodyCard: t('requests.card.panelBodyCard'),
      panelBodyMixed: t('requests.card.panelBodyMixed'),
      panelBodyCredit: t('requests.card.panelBodyCredit'),
      panelNote: t('requests.card.panelNote'),
      panelBack: t('requests.card.panelBack'),
      panelConfirm: t('requests.card.panelConfirm'),
      panelWorking: t('requests.card.panelWorking'),
      errorConflict: t('requests.card.errorConflict'),
      errorGeneric: t('requests.card.errorGeneric'),
      chat: buildOpenChatLabels(tc),
    },
  };
}

export function buildCoachSessionsLabels(
  t: Translate,
  tf: Translate,
  tr: Translate,
  tt: Translate,
  tc: Translate,
): CoachSessionsListLabels {
  return {
    tabAll: t('sessions.tabAll'),
    tabWaiting: t('sessions.tabWaiting'),
    tabPay: t('sessions.tabPay'),
    tabConfirmed: t('sessions.tabConfirmed'),
    emptyTitle: t('sessions.emptyTitle'),
    emptyDescription: t('sessions.emptyDescription'),
    emptyAction: t('sessions.emptyAction'),
    paidNotice: t('sessions.paidNotice'),
    cancelledNotice: t('sessions.cancelledNotice'),
    requestCancelledNotice: t('sessions.requestCancelledNotice'),
    reviewedNotice: tr('session.reviewedNotice'),
    card: {
      statusRequested: t('sessions.card.statusRequested'),
      statusAwaitingPayment: t('sessions.card.statusAwaitingPayment'),
      statusConfirmed: t('sessions.card.statusConfirmed'),
      statusRejected: t('sessions.card.statusRejected'),
      statusCancelled: t('sessions.card.statusCancelled'),
      statusCancelledByCoach: t('sessions.card.statusCancelledByCoach'),
      statusExpired: t('sessions.card.statusExpired'),
      payNote: t('sessions.card.payNote'),
      pay: t('sessions.card.pay'),
      paying: t('sessions.card.paying'),
      cancelRequest: t('sessions.card.cancelRequest'),
      cancel: t('sessions.card.cancel'),
      cancelLocked: t('sessions.card.cancelLocked'),
      paid: t('sessions.card.paid'),
      paidCard: t('sessions.card.paidCard'),
      paidCredit: t('sessions.card.paidCredit'),
      refundedCard: t('sessions.card.refundedCard'),
      refundedMixed: t('sessions.card.refundedMixed'),
      refundedCredit: t('sessions.card.refundedCredit'),
      errorTooLate: t('sessions.card.errorTooLate'),
      errorConflict: t('sessions.card.errorConflict'),
      errorGeneric: t('sessions.card.errorGeneric'),
      split: buildTeamSplitLabels(tt),
      chat: buildOpenChatLabels(tc),
      review: {
        write: tr('session.write'),
        yourReview: tr('session.yourReview'),
        stars: tr('stars'),
        form: buildReviewFormLabels(tr),
      },
      credit: {
        title: tf('booking.summary.credit.title'),
        available: tf('booking.summary.credit.available'),
        none: tf('booking.summary.credit.none'),
        toggle: tf('booking.summary.credit.toggle'),
        limited: tf('booking.summary.credit.limited'),
      },
      panel: {
        title: t('sessions.cancel.title'),
        optionRefundTitle: t('sessions.cancel.optionRefundTitle'),
        optionRefundCard: t('sessions.cancel.optionRefundCard'),
        optionRefundMixed: t('sessions.cancel.optionRefundMixed'),
        optionCredit: t('sessions.cancel.optionCredit'),
        optionCreditTitle: t('sessions.cancel.optionCreditTitle'),
        warning: t('sessions.cancel.warning'),
        back: t('sessions.cancel.back'),
        confirm: t('sessions.cancel.confirm'),
        working: t('sessions.cancel.working'),
      },
    },
  };
}
