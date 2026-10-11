import { router } from '../init';
import { fieldApprovalRouter } from './field-approval';
import { fieldOwnerRouter } from './field-owner';
import { fieldSubmissionRouter } from './field-submission';
import { fieldsRouter } from './fields';
import { notificationsRouter } from './notifications';
import { ownerBookingsRouter } from './owner-bookings';
import { reservationsRouter } from './reservations';
import { teamsRouter } from './teams';

export const appRouter = router({
  fields: fieldsRouter,
  fieldSubmission: fieldSubmissionRouter,
  fieldApproval: fieldApprovalRouter,
  fieldOwner: fieldOwnerRouter,
  reservations: reservationsRouter,
  notifications: notificationsRouter,
  ownerBookings: ownerBookingsRouter,
  teams: teamsRouter,
});

export type AppRouter = typeof appRouter;
