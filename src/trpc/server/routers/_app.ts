import { router } from '../init';
import { fieldApprovalRouter } from './field-approval';
import { fieldOwnerRouter } from './field-owner';
import { fieldSubmissionRouter } from './field-submission';
import { fieldsRouter } from './fields';
import { notificationsRouter } from './notifications';
import { reservationsRouter } from './reservations';

export const appRouter = router({
  fields: fieldsRouter,
  fieldSubmission: fieldSubmissionRouter,
  fieldApproval: fieldApprovalRouter,
  fieldOwner: fieldOwnerRouter,
  reservations: reservationsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
