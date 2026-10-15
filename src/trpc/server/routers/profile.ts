import { TRPCError } from '@trpc/server';
import { APIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import { auth } from '@/lib/auth';
import {
  anonymizeAccount,
  getDeletionStatus,
} from '@/lib/server/account-deletion';
import {
  CLOUDINARY_AVATAR_FOLDER,
  createUploadSignature,
} from '@/lib/server/cloudinary';
import { listCreditHistory } from '@/lib/server/credit-history';

const creditHistoryInput = z.object({
  offset: z.number().int().min(0).max(100000),
  limit: z.number().int().min(1).max(50),
});

const deleteAccountInput = z.object({
  password: z.string().min(1).max(128),
  acceptCreditLoss: z.boolean(),
});

async function assertPassword(email: string, password: string): Promise<void> {
  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.statusCode === 429) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
      }
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    throw error;
  }
}

export const profileRouter = router({
  uploadAvatarSignature: protectedProcedure.mutation(() =>
    createUploadSignature(CLOUDINARY_AVATAR_FOLDER),
  ),

  creditHistory: protectedProcedure
    .input(creditHistoryInput)
    .query(({ ctx, input }) =>
      listCreditHistory(ctx.prisma, ctx.session.user.id, input),
    ),

  deletionStatus: protectedProcedure.query(({ ctx }) =>
    getDeletionStatus(ctx.prisma, ctx.session.user.id),
  ),

  deleteAccount: protectedProcedure
    .input(deleteAccountInput)
    .mutation(async ({ ctx, input }) => {
      const { id, email } = ctx.session.user;

      await assertPassword(email, input.password);

      const outcome = await ctx.prisma.$transaction(
        (tx) =>
          anonymizeAccount(tx, {
            userId: id,
            acceptCreditLoss: input.acceptCreditLoss,
          }),
        { timeout: 20000 },
      );

      if (outcome === 'blocked') throw new TRPCError({ code: 'CONFLICT' });
      if (outcome === 'credit_not_accepted') {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }
      if (outcome === 'not_found') throw new TRPCError({ code: 'NOT_FOUND' });

      return { id };
    }),
});
