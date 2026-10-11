import 'server-only';

import { TRPCError } from '@trpc/server';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import type { LocalizedText } from '@/lib/i18n-content';
import { shortReviewerName, type ReviewPage } from '@/lib/reviews/review';

export interface CreateFieldReviewInput {
  userId: string;
  reservationId: string;
  rating: number;
  comment: string;
}

export interface ListFieldReviewsInput {
  fieldId: string;
  offset: number;
  limit: number;
}

function reviewReceivedMessage(
  reviewerName: string,
  rating: number,
): LocalizedText {
  return {
    el: `Ο/Η ${reviewerName} άφησε κριτική ${rating}/5 για το γήπεδό σου.`,
    en: `${reviewerName} left a ${rating}/5 review for your field.`,
  };
}

export async function createFieldReview(
  prisma: PrismaClient,
  input: CreateFieldReviewInput,
): Promise<{ id: string }> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
    select: {
      userId: true,
      status: true,
      user: { select: { name: true } },
      review: { select: { id: true } },
      slot: {
        select: {
          endTime: true,
          field: { select: { id: true, ownerId: true } },
        },
      },
    },
  });

  if (!reservation) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
  }

  if (reservation.userId !== input.userId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  const field = reservation.slot.field;

  if (field.ownerId === input.userId) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  if (
    reservation.status !== 'CONFIRMED' ||
    reservation.slot.endTime > new Date()
  ) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  const payment = await prisma.payment.findFirst({
    where: { reservationId: input.reservationId, status: 'SUCCEEDED' },
    select: { id: true },
  });

  if (!payment) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  if (reservation.review) {
    throw new TRPCError({ code: 'CONFLICT' });
  }

  const comment = input.comment.trim();

  try {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.fieldReview.create({
        data: {
          fieldId: field.id,
          reviewerId: input.userId,
          reservationId: input.reservationId,
          rating: input.rating,
          comment: comment || null,
        },
        select: { id: true },
      });

      await tx.notification.create({
        data: {
          userId: field.ownerId,
          type: 'REVIEW_RECEIVED',
          message: reviewReceivedMessage(
            shortReviewerName(reservation.user.name),
            input.rating,
          ),
          linkUrl: `/fields/${field.id}`,
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

export async function listFieldReviews(
  prisma: PrismaClient,
  input: ListFieldReviewsInput,
): Promise<ReviewPage> {
  const [rows, aggregate] = await Promise.all([
    prisma.fieldReview.findMany({
      where: { fieldId: input.fieldId },
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
    prisma.fieldReview.aggregate({
      where: { fieldId: input.fieldId },
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
