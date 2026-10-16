import { router } from '../init';
import { coachApprovalRouter } from './coach-approval';
import { coachReviewsRouter } from './coach-reviews';
import { coachSessionsRouter } from './coach-sessions';
import { coachSlotsRouter } from './coach-slots';
import { coachesRouter } from './coaches';
import { conversationsRouter } from './conversations';
import { fieldApprovalRouter } from './field-approval';
import { fieldOwnerRouter } from './field-owner';
import { fieldReviewsRouter } from './field-reviews';
import { fieldSubmissionRouter } from './field-submission';
import { fieldsRouter } from './fields';
import { notificationsRouter } from './notifications';
import { ownerBookingsRouter } from './owner-bookings';
import { profileRouter } from './profile';
import { reservationsRouter } from './reservations';
import { sessionSplitsRouter } from './session-splits';
import { splitsRouter } from './splits';
import { statsRouter } from './stats';
import { teamsRouter } from './teams';
import { tournamentRequestsRouter } from './tournament-requests';
import { tournamentsRouter } from './tournaments';

export const appRouter = router({
  fields: fieldsRouter,
  fieldSubmission: fieldSubmissionRouter,
  fieldApproval: fieldApprovalRouter,
  fieldOwner: fieldOwnerRouter,
  fieldReviews: fieldReviewsRouter,
  reservations: reservationsRouter,
  notifications: notificationsRouter,
  ownerBookings: ownerBookingsRouter,
  teams: teamsRouter,
  splits: splitsRouter,
  sessionSplits: sessionSplitsRouter,
  coaches: coachesRouter,
  coachApproval: coachApprovalRouter,
  coachSlots: coachSlotsRouter,
  coachSessions: coachSessionsRouter,
  coachReviews: coachReviewsRouter,
  conversations: conversationsRouter,
  profile: profileRouter,
  tournaments: tournamentsRouter,
  tournamentRequests: tournamentRequestsRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
