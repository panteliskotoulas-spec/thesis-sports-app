import { router } from '../init';
import { fieldsRouter } from './fields';

export const appRouter = router({
  fields: fieldsRouter,
});

export type AppRouter = typeof appRouter;
