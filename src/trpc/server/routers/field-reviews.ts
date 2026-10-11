import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../init';
import { REVIEW_COMMENT_MAX, type ReviewPage } from '@/lib/reviews/review';
import { createFieldReview, listFieldReviews } from '@/lib/server/field-review';

const listInput = z.object({
  fieldId: z.string().min(1),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(20),
});

const createInput = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(REVIEW_COMMENT_MAX),
});

export const fieldReviewsRouter = router({
  list: publicProcedure
    .input(listInput)
    .query(
      ({ ctx, input }): Promise<ReviewPage> =>
        listFieldReviews(ctx.prisma, input),
    ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    createFieldReview(ctx.prisma, {
      userId: ctx.session.user.id,
      reservationId: input.reservationId,
      rating: input.rating,
      comment: input.comment,
    }),
  ),
});
