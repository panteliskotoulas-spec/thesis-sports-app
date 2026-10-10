import 'server-only';

import { createCallerFactory, createTRPCContext } from './init';
import { appRouter } from './routers/_app';

const createCaller = createCallerFactory(appRouter);

export async function getServerCaller() {
  return createCaller(await createTRPCContext());
}
