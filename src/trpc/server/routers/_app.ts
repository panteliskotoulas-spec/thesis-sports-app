import { router } from '../init';
import { fieldSubmissionRouter } from './field-submission';
import { fieldsRouter } from './fields';

export const appRouter = router({
  fields: fieldsRouter,
  fieldSubmission: fieldSubmissionRouter,
});

export type AppRouter = typeof appRouter;
