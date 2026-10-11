import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../init';
import { REVIEW_COMMENT_MAX, type ReviewPage } from '@/lib/reviews/review';
import { createCoachReview, listCoachReviews } from '@/lib/server/coach-review';

const listInput = z.object({
  coachId: z.string().min(1),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(20),
});

const createInput = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(REVIEW_COMMENT_MAX),
});

export const coachReviewsRouter = router({
  list: publicProcedure
    .input(listInput)
    .query(
      ({ ctx, input }): Promise<ReviewPage> =>
        listCoachReviews(ctx.prisma, input),
    ),

  create: protectedProcedure.input(createInput).mutation(({ ctx, input }) =>
    createCoachReview(ctx.prisma, {
      userId: ctx.session.user.id,
      sessionId: input.sessionId,
      rating: input.rating,
      comment: input.comment,
    }),
  ),
});
