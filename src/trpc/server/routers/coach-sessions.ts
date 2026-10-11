import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import type {
  CoachRequestRow,
  CoachSessionRow,
} from '@/lib/coaches/coach-session';
import {
  cancelSession,
  cancelSessionByCoach,
  listCoachRequests,
  listUserSessions,
  requestSession,
  respondToRequest,
} from '@/lib/server/coach-session';
import { startCoachSessionCheckout } from '@/lib/server/coach-session-payment';

const requestInput = z.object({
  slotId: z.string().min(1),
  teamId: z.string().min(1).nullable(),
});

const respondInput = z.object({
  id: z.string().min(1),
  decision: z.enum(['accept', 'reject']),
});

const payInput = z.object({
  sessionId: z.string().min(1),
  useCredit: z.boolean(),
  lng: z.enum(['el', 'en']),
});

const cancelInput = z.object({
  sessionId: z.string().min(1),
  compensation: z.enum(['REFUND', 'CREDIT']).nullable(),
});

const cancelByCoachInput = z.object({
  sessionId: z.string().min(1),
});

export const coachSessionsRouter = router({
  listMine: protectedProcedure.query(
    ({ ctx }): Promise<{ rows: CoachSessionRow[]; balance: number }> =>
      listUserSessions(ctx.prisma, ctx.session.user.id),
  ),

  listIncoming: protectedProcedure.query(
    ({ ctx }): Promise<CoachRequestRow[]> =>
      listCoachRequests(ctx.prisma, ctx.session.user.id),
  ),

  request: protectedProcedure.input(requestInput).mutation(({ ctx, input }) =>
    requestSession(ctx.prisma, {
      userId: ctx.session.user.id,
      slotId: input.slotId,
      teamId: input.teamId,
    }),
  ),

  respond: protectedProcedure.input(respondInput).mutation(({ ctx, input }) =>
    respondToRequest(ctx.prisma, {
      coachUserId: ctx.session.user.id,
      sessionId: input.id,
      decision: input.decision,
    }),
  ),

  pay: protectedProcedure.input(payInput).mutation(({ ctx, input }) =>
    startCoachSessionCheckout(ctx.prisma, {
      userId: ctx.session.user.id,
      userEmail: ctx.session.user.email,
      sessionId: input.sessionId,
      useCredit: input.useCredit,
      lng: input.lng,
    }),
  ),

  cancel: protectedProcedure.input(cancelInput).mutation(({ ctx, input }) =>
    cancelSession(ctx.prisma, {
      userId: ctx.session.user.id,
      sessionId: input.sessionId,
      compensation: input.compensation,
    }),
  ),

  cancelByCoach: protectedProcedure
    .input(cancelByCoachInput)
    .mutation(({ ctx, input }) =>
      cancelSessionByCoach(ctx.prisma, {
        coachUserId: ctx.session.user.id,
        sessionId: input.sessionId,
      }),
    ),
});
