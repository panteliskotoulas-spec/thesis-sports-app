import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../init';
import {
  FIELD_SORTS,
  FIELD_TYPES,
  todayInAthens,
  type FieldSort,
} from '@/lib/fields/filters';
import {
  dayWindow,
  REVIEWS_PREVIEW,
  type FieldDetailRow,
} from '@/lib/fields/detail';
import { SPORT_TYPES, type FieldListRow } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';

const TIME_ZONE = 'Europe/Athens';
const MS_PER_HOUR = 3_600_000;

const dayInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const listInput = z.object({
  q: z.string().max(100),
  type: z.enum(FIELD_TYPES).nullable(),
  sport: z.enum(SPORT_TYPES).nullable(),
  date: dayInput.nullable(),
  sort: z.enum(FIELD_SORTS),
});

function athensOffsetMs(utcMidnight: Date): number {
  const label =
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      timeZoneName: 'longOffset',
    })
      .formatToParts(utcMidnight)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(label);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0)) * 60_000;
}

function athensDayStart(day: string): Date {
  const utcMidnight = new Date(`${day}T00:00:00Z`);
  return new Date(utcMidnight.getTime() - athensOffsetMs(utcMidnight));
}

function athensDayRange(day: string): { start: Date; end: Date } {
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return {
    start: athensDayStart(day),
    end: athensDayStart(next.toISOString().slice(0, 10)),
  };
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/ς/g, 'σ');
}

function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
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

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function matchesQuery(row: FieldListRow, query: string): boolean {
  const haystack = [row.name.el, row.name.en, row.area.el, row.area.en]
    .map(normalize)
    .join(' ');
  return haystack.includes(normalize(query));
}

function compareAvailability(a: FieldListRow, b: FieldListRow): number {
  return Number(a.nextSlotAt === null) - Number(b.nextSlotAt === null);
}

function compareBySort(
  a: FieldListRow,
  b: FieldListRow,
  sort: FieldSort,
): number {
  if (sort === 'price') {
    return (
      (a.pricePerHourFrom ?? Number.MAX_SAFE_INTEGER) -
      (b.pricePerHourFrom ?? Number.MAX_SAFE_INTEGER)
    );
  }
  if (sort === 'rating') {
    return (b.rating?.average ?? -1) - (a.rating?.average ?? -1);
  }
  return 0;
}

export const fieldsRouter = router({
  list: publicProcedure
    .input(listInput)
    .query(async ({ ctx, input }): Promise<FieldListRow[]> => {
      const now = new Date();
      const dayRange = input.date ? athensDayRange(input.date) : null;

      const fields = await ctx.prisma.field.findMany({
        where: {
          status: 'APPROVED',
          ...(input.type && { indoor: input.type === 'indoor' }),
          ...(input.sport && { sports: { has: input.sport } }),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          area: true,
          indoor: true,
          sports: true,
          images: {
            orderBy: { order: 'asc' },
            take: 1,
            select: { url: true },
          },
          slots: {
            where: {
              startTime: {
                gt: now,
                ...(dayRange && { gte: dayRange.start, lt: dayRange.end }),
              },
              ...(input.sport && { sportType: input.sport }),
              OR: [
                { status: 'OPEN' },
                { status: 'PENDING_PAYMENT', holdExpiresAt: { lt: now } },
              ],
            },
            orderBy: { startTime: 'asc' },
            select: { startTime: true, endTime: true, price: true },
          },
        },
      });

      const ratings = await ctx.prisma.fieldReview.groupBy({
        by: ['fieldId'],
        where: { fieldId: { in: fields.map((field) => field.id) } },
        _avg: { rating: true },
        _count: { rating: true },
      });
      const ratingByField = new Map(
        ratings.map((entry) => [
          entry.fieldId,
          { average: entry._avg.rating ?? 0, count: entry._count.rating },
        ]),
      );

      const rows: FieldListRow[] = fields.map((field) => ({
        id: field.id,
        name: asLocalized(field.name),
        area: asLocalized(field.area),
        indoor: field.indoor,
        sports: field.sports,
        imageUrl: field.images[0]?.url ?? null,
        rating: ratingByField.get(field.id) ?? null,
        nextSlotAt: field.slots[0]?.startTime ?? null,
        pricePerHourFrom: cheapestPerHour(field.slots),
      }));

      return rows
        .filter((row) => !input.q || matchesQuery(row, input.q))
        .filter((row) => dayRange === null || row.nextSlotAt !== null)
        .sort(
          (a, b) =>
            compareAvailability(a, b) || compareBySort(a, b, input.sort),
        );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string(), date: dayInput.nullable() }))
    .query(async ({ ctx, input }): Promise<FieldDetailRow> => {
      const field = await ctx.prisma.field.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          ownerId: true,
          status: true,
          name: true,
          description: true,
          area: true,
          address: true,
          latitude: true,
          longitude: true,
          indoor: true,
          sports: true,
          images: {
            orderBy: { order: 'asc' },
            select: { url: true },
          },
          owner: { select: { accountType: true, businessName: true } },
        },
      });

      const isOwner = field !== null && ctx.session?.user.id === field.ownerId;
      if (!field || (field.status !== 'APPROVED' && !isOwner)) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Field not found' });
      }

      const now = new Date();
      const today = todayInAthens(now);

      const [slots, ratingStats, reviews] = await Promise.all([
        ctx.prisma.availabilitySlot.findMany({
          where: {
            fieldId: field.id,
            startTime: { gt: now },
            OR: [
              { status: 'OPEN' },
              { status: 'PENDING_PAYMENT', holdExpiresAt: { lt: now } },
            ],
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            price: true,
            sportType: true,
          },
        }),
        ctx.prisma.fieldReview.aggregate({
          where: { fieldId: field.id },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        ctx.prisma.fieldReview.findMany({
          where: { fieldId: field.id },
          orderBy: { createdAt: 'desc' },
          take: REVIEWS_PREVIEW,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { name: true } },
          },
        }),
      ]);

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
        id: field.id,
        name: asLocalized(field.name),
        description: asLocalized(field.description),
        area: asLocalized(field.area),
        address: field.address,
        latitude: field.latitude,
        longitude: field.longitude,
        indoor: field.indoor,
        sports: field.sports,
        images: field.images.map((image) => image.url),
        rating:
          ratingStats._count.rating > 0
            ? {
                average: ratingStats._avg.rating ?? 0,
                count: ratingStats._count.rating,
              }
            : null,
        pricePerHourFrom: cheapestPerHour(slots),
        businessName:
          field.owner.accountType === 'BUSINESS'
            ? field.owner.businessName
            : null,
        days,
        selectedDay,
        slots: selectedSlots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price.toNumber(),
          sportType: slot.sportType,
        })),
        nextAvailableDay,
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          reviewerName: shortName(review.reviewer.name),
        })),
      };
    }),
});
