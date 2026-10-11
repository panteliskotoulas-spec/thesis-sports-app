import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, router } from '../init';
import {
  COACH_REJECTION_REASON_MAX,
  COACH_STATUSES,
  type CoachApprovalRecordList,
  type CoachStatusValue,
} from '@/lib/coaches/coach';
import type { LocalizedText } from '@/lib/i18n-content';
import {
  coachApprovedMessage,
  coachRejectedMessage,
} from '@/lib/server/coach-notifications';
import { toLocalized } from '@/lib/server/translate';

const idInput = z.object({ id: z.string().min(1) });

const rejectInput = idInput.extend({
  lng: z.enum(['el', 'en']),
  reason: z.string().trim().max(COACH_REJECTION_REASON_MAX),
});

function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
}

export const coachApprovalRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(COACH_STATUSES) }))
    .query(async ({ ctx, input }): Promise<CoachApprovalRecordList> => {
      const [coaches, grouped] = await Promise.all([
        ctx.prisma.coach.findMany({
          where: { status: input.status },
          orderBy: { createdAt: input.status === 'PENDING' ? 'asc' : 'desc' },
          select: {
            id: true,
            sportType: true,
            area: true,
            bio: true,
            certifications: true,
            hourlyRate: true,
            status: true,
            rejectionReason: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        }),
        ctx.prisma.coach.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ]);

      const counts: Record<CoachStatusValue, number> = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
      };
      for (const entry of grouped) {
        counts[entry.status] = entry._count._all;
      }

      return {
        counts,
        coaches: coaches.map((coach) => ({
          id: coach.id,
          name: coach.user.name,
          email: coach.user.email,
          sportType: coach.sportType,
          area: asLocalized(coach.area),
          bio: asLocalized(coach.bio),
          certifications: coach.certifications,
          hourlyRate: Number(coach.hourlyRate),
          status: coach.status,
          rejectionReason:
            coach.rejectionReason === null
              ? null
              : asLocalized(coach.rejectionReason),
          createdAt: coach.createdAt,
        })),
      };
    }),

  approve: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const coach = await ctx.prisma.coach.findUnique({
      where: { id: input.id },
      select: { id: true, userId: true },
    });
    if (!coach) throw new TRPCError({ code: 'NOT_FOUND' });

    await ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.coach.updateMany({
        where: { id: coach.id, status: 'PENDING' },
        data: { status: 'APPROVED' },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.notification.create({
        data: {
          userId: coach.userId,
          type: 'COACH_PROFILE_APPROVED',
          message: coachApprovedMessage(),
          linkUrl: '/coaches/apply',
        },
      });
    });

    return { id: coach.id };
  }),

  reject: adminProcedure.input(rejectInput).mutation(async ({ ctx, input }) => {
    const coach = await ctx.prisma.coach.findUnique({
      where: { id: input.id },
      select: { id: true, userId: true },
    });
    if (!coach) throw new TRPCError({ code: 'NOT_FOUND' });

    const reason = input.reason
      ? await toLocalized(input.reason, input.lng)
      : null;

    await ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.coach.updateMany({
        where: { id: coach.id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          ...(reason && { rejectionReason: reason }),
        },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.notification.create({
        data: {
          userId: coach.userId,
          type: 'COACH_PROFILE_REJECTED',
          message: coachRejectedMessage(reason),
          linkUrl: '/coaches/apply',
        },
      });
    });

    return { id: coach.id };
  }),
});
