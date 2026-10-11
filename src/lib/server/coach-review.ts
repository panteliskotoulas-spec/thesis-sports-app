import 'server-only';

import { TRPCError } from '@trpc/server';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import type { LocalizedText } from '@/lib/i18n-content';
import {
  shortReviewerName,
  type ReviewPage,
  type ReviewRating,
} from '@/lib/reviews/review';

export interface CreateCoachReviewInput {
  userId: string;
  sessionId: string;
  rating: number;
  comment: string;
}

export interface ListCoachReviewsInput {
  coachId: string;
  offset: number;
  limit: number;
}

function reviewReceivedMessage(
  reviewerName: string,
  rating: number,
): LocalizedText {
  return {
    el: `Ο/Η ${reviewerName} άφησε κριτική ${rating}/5 για τη συνεδρία σου.`,
    en: `${reviewerName} left a ${rating}/5 review for your session.`,
  };
}

export async function createCoachReview(
  prisma: PrismaClient,
  input: CreateCoachReviewInput,
): Promise<{ id: string }> {
  const session = await prisma.coachingSession.findUnique({
    where: { id: input.sessionId },
    select: {
      userId: true,
      status: true,
      user: { select: { name: true } },
      review: { select: { id: true } },
      slot: {
        select: {
          endTime: true,
          coach: { select: { id: true, userId: true } },
        },
      },
    },
  });

  if (!session) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
  }

  if (session.userId !== input.userId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  if (session.slot.coach.userId === input.userId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  if (session.status !== 'CONFIRMED' || session.slot.endTime > new Date()) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  if (session.review) {
    throw new TRPCError({ code: 'CONFLICT' });
  }

  const comment = input.comment.trim();
  const coach = session.slot.coach;

  try {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.coachReview.create({
        data: {
          coachId: coach.id,
          reviewerId: input.userId,
          sessionId: input.sessionId,
          rating: input.rating,
          comment: comment || null,
        },
        select: { id: true },
      });

      await tx.notification.create({
        data: {
          userId: coach.userId,
          type: 'REVIEW_RECEIVED',
          message: reviewReceivedMessage(
            shortReviewerName(session.user.name),
            input.rating,
          ),
          linkUrl: `/coaches/${coach.id}`,
        },
      });

      return review;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new TRPCError({ code: 'CONFLICT' });
    }
    throw error;
  }
}

export async function listCoachReviews(
  prisma: PrismaClient,
  input: ListCoachReviewsInput,
): Promise<ReviewPage> {
  const [rows, aggregate] = await Promise.all([
    prisma.coachReview.findMany({
      where: { coachId: input.coachId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: input.offset,
      take: input.limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { name: true } },
      },
    }),
    prisma.coachReview.aggregate({
      where: { coachId: input.coachId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const count = aggregate._count.rating;

  return {
    items: rows.map((row) => ({
      id: row.id,
      reviewerName: shortReviewerName(row.reviewer.name),
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt,
    })),
    total: count,
    rating: count > 0 ? { average: aggregate._avg.rating ?? 0, count } : null,
  };
}

export async function getCoachRatings(
  prisma: PrismaClient,
  coachIds: string[],
): Promise<Map<string, ReviewRating>> {
  if (coachIds.length === 0) return new Map();

  const groups = await prisma.coachReview.groupBy({
    by: ['coachId'],
    where: { coachId: { in: coachIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return new Map(
    groups.map((entry) => [
      entry.coachId,
      { average: entry._avg.rating ?? 0, count: entry._count.rating },
    ]),
  );
}
