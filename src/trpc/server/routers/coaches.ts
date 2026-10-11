import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@/generated/prisma/client';
import { protectedProcedure, publicProcedure, router } from '../init';
import {
  COACH_AREA_MAX,
  COACH_BIO_MAX,
  COACH_CERTIFICATIONS_MAX,
  COACH_RATE_MAX,
  COACH_RATE_MIN,
  type CoachMineRecord,
} from '@/lib/coaches/coach';
import type { CoachDetailRow, CoachListRow } from '@/lib/coaches/coach-public';
import { dayWindow } from '@/lib/fields/detail';
import { todayInAthens } from '@/lib/fields/filters';
import { SPORT_TYPES } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';
import { toLocalized } from '@/lib/server/translate';

const MS_PER_HOUR = 3_600_000;

const dayInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const listInput = z.object({
  q: z.string().max(100),
  sport: z.enum(SPORT_TYPES).nullable(),
});

const getByIdInput = z.object({
  id: z.string().min(1),
  date: dayInput.nullable(),
});

const saveInput = z.object({
  lng: z.enum(['el', 'en']),
  sportType: z.enum(SPORT_TYPES),
  area: z.string().trim().min(1).max(COACH_AREA_MAX),
  bio: z.string().trim().min(1).max(COACH_BIO_MAX),
  hourlyRate: z.number().min(COACH_RATE_MIN).max(COACH_RATE_MAX),
  certifications: z.string().trim().max(COACH_CERTIFICATIONS_MAX),
});

function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/ς/g, 'σ');
}

function cheapestPerHour(
  slots: { startTime: Date; endTime: Date; price: { toNumber(): number } }[],
): number | null {
  const prices = slots.flatMap((slot) => {
    const hours =
      (slot.endTime.getTime() - slot.startTime.getTime()) / MS_PER_HOUR;
    return hours > 0 ? [slot.price.toNumber() / hours] : [];
  });
  return prices.length > 0 ? Math.round(Math.min(...prices) * 100) / 100 : null;
}

function matchesQuery(row: CoachListRow, query: string): boolean {
  const haystack = [row.name, row.area.el, row.area.en]
    .map(normalize)
    .join(' ');
  return haystack.includes(normalize(query));
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
  list: publicProcedure
    .input(listInput)
    .query(async ({ ctx, input }): Promise<CoachListRow[]> => {
      const now = new Date();

      const coaches = await ctx.prisma.coach.findMany({
        where: {
          status: 'APPROVED',
          ...(input.sport && { sportType: input.sport }),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sportType: true,
          area: true,
          bio: true,
          hourlyRate: true,
          user: { select: { name: true } },
          slots: {
            where: { status: 'OPEN', startTime: { gt: now } },
            orderBy: { startTime: 'asc' },
            select: { startTime: true, endTime: true, price: true },
          },
        },
      });

      const rows: CoachListRow[] = coaches.map((coach) => ({
        id: coach.id,
        name: coach.user.name,
        sportType: coach.sportType,
        area: asLocalized(coach.area),
        bio: asLocalized(coach.bio),
        hourlyRate: Number(coach.hourlyRate),
        nextSlotAt: coach.slots[0]?.startTime ?? null,
        pricePerHourFrom: cheapestPerHour(coach.slots),
      }));

      return rows
        .filter((row) => !input.q || matchesQuery(row, input.q))
        .sort(
          (a, b) =>
            Number(a.nextSlotAt === null) - Number(b.nextSlotAt === null),
        );
    }),

  getById: publicProcedure
    .input(getByIdInput)
    .query(async ({ ctx, input }): Promise<CoachDetailRow> => {
      const coach = await ctx.prisma.coach.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          userId: true,
          status: true,
          sportType: true,
          area: true,
          bio: true,
          certifications: true,
          hourlyRate: true,
          user: { select: { name: true } },
        },
      });

      const isOwner = coach !== null && ctx.session?.user.id === coach.userId;
      if (!coach || (coach.status !== 'APPROVED' && !isOwner)) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coach not found' });
      }

      const now = new Date();
      const today = todayInAthens(now);

      const slots = await ctx.prisma.coachAvailabilitySlot.findMany({
        where: {
          coachId: coach.id,
          status: 'OPEN',
          startTime: { gt: now },
        },
        orderBy: { startTime: 'asc' },
        select: { id: true, startTime: true, endTime: true, price: true },
      });

      const datedSlots = slots.map((slot) => ({
        ...slot,
        day: todayInAthens(slot.startTime),
      }));
      const availableDays = new Set(datedSlots.map((slot) => slot.day));
      const days = dayWindow(today).map((day) => ({
        day,
        available: availableDays.has(day),
      }));

      const requestedDay =
        input.date && input.date >= today ? input.date : null;
      const selectedDay =
        requestedDay ?? days.find((entry) => entry.available)?.day ?? null;
      const selectedSlots = selectedDay
        ? datedSlots.filter((slot) => slot.day === selectedDay)
        : [];
      const nextAvailableDay =
        selectedDay && selectedSlots.length === 0
          ? (Array.from(availableDays)
              .sort()
              .find((day) => day > selectedDay) ?? null)
          : null;

      return {
        id: coach.id,
        name: coach.user.name,
        sportType: coach.sportType,
        area: asLocalized(coach.area),
        bio: asLocalized(coach.bio),
        certifications: coach.certifications,
        hourlyRate: Number(coach.hourlyRate),
        isSelf: isOwner,
        pricePerHourFrom: cheapestPerHour(slots),
        days,
        selectedDay,
        slots: selectedSlots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price.toNumber(),
        })),
        nextAvailableDay,
      };
    }),

  getMine: protectedProcedure.query(
    async ({ ctx }): Promise<CoachMineRecord | null> => {
      const coach = await ctx.prisma.coach.findUnique({
        where: { userId: ctx.session.user.id },
        select: {
          status: true,
          rejectionReason: true,
          sportType: true,
          area: true,
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
        area: asLocalized(coach.area),
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
        area: true,
        bio: true,
        hourlyRate: true,
      },
    });

    if (!existing) {
      const [area, bio] = await Promise.all([
        toLocalized(input.area, input.lng),
        toLocalized(input.bio, input.lng),
      ]);

      try {
        await ctx.prisma.coach.create({
          data: {
            userId,
            sportType: input.sportType,
            area,
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

    const [area, bio] = await Promise.all([
      resolveText(input.area, asLocalized(existing.area), input.lng),
      resolveText(input.bio, asLocalized(existing.bio), input.lng),
    ]);

    const needsReview =
      existing.status === 'REJECTED' ||
      bio.changed ||
      input.sportType !== existing.sportType ||
      hourlyRate !== Number(existing.hourlyRate);

    const updated = await ctx.prisma.coach.updateMany({
      where: { id: existing.id, status: existing.status },
      data: {
        sportType: input.sportType,
        area: area.value,
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
