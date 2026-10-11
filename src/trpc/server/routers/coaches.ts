import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@/generated/prisma/client';
import { protectedProcedure, router } from '../init';
import {
  COACH_BIO_MAX,
  COACH_CERTIFICATIONS_MAX,
  COACH_RATE_MAX,
  COACH_RATE_MIN,
  type CoachMineRecord,
} from '@/lib/coaches/coach';
import { SPORT_TYPES } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';
import { toLocalized } from '@/lib/server/translate';

const saveInput = z.object({
  lng: z.enum(['el', 'en']),
  sportType: z.enum(SPORT_TYPES),
  bio: z.string().trim().min(1).max(COACH_BIO_MAX),
  hourlyRate: z.number().min(COACH_RATE_MIN).max(COACH_RATE_MAX),
  certifications: z.string().trim().max(COACH_CERTIFICATIONS_MAX),
});

function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
}

async function resolveText(
  text: string,
  current: LocalizedText,
  lng: 'el' | 'en',
): Promise<{ value: LocalizedText; changed: boolean }> {
  if (text === current[lng]) return { value: current, changed: false };
  return { value: await toLocalized(text, lng), changed: true };
}

export const coachesRouter = router({
  getMine: protectedProcedure.query(
    async ({ ctx }): Promise<CoachMineRecord | null> => {
      const coach = await ctx.prisma.coach.findUnique({
        where: { userId: ctx.session.user.id },
        select: {
          status: true,
          rejectionReason: true,
          sportType: true,
          bio: true,
          hourlyRate: true,
          certifications: true,
        },
      });

      if (!coach) return null;

      return {
        status: coach.status,
        rejectionReason:
          coach.rejectionReason === null
            ? null
            : asLocalized(coach.rejectionReason),
        sportType: coach.sportType,
        bio: asLocalized(coach.bio),
        hourlyRate: Number(coach.hourlyRate),
        certifications: coach.certifications,
      };
    },
  ),

  save: protectedProcedure.input(saveInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const hourlyRate = Math.round(input.hourlyRate * 100) / 100;
    const certifications = input.certifications || null;

    const existing = await ctx.prisma.coach.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        sportType: true,
        bio: true,
        hourlyRate: true,
      },
    });

    if (!existing) {
      const bio = await toLocalized(input.bio, input.lng);

      try {
        await ctx.prisma.coach.create({
          data: {
            userId,
            sportType: input.sportType,
            bio,
            hourlyRate,
            certifications,
          },
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

      return { sentForReview: true };
    }

    const bio = await resolveText(
      input.bio,
      asLocalized(existing.bio),
      input.lng,
    );

    const needsReview =
      existing.status === 'REJECTED' ||
      bio.changed ||
      input.sportType !== existing.sportType ||
      hourlyRate !== Number(existing.hourlyRate);

    const updated = await ctx.prisma.coach.updateMany({
      where: { id: existing.id, status: existing.status },
      data: {
        sportType: input.sportType,
        bio: bio.value,
        hourlyRate,
        certifications,
        ...(needsReview && {
          status: 'PENDING' as const,
          rejectionReason: Prisma.DbNull,
        }),
      },
    });
    if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

    return { sentForReview: needsReview };
  }),
});
