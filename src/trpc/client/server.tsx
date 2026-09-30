import 'server-only';

import { cache } from 'react';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { appRouter } from '@/trpc/server/routers/_app';
import { createTRPCContext } from '@/trpc/server/init';
import { makeQueryClient } from './query-client';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
