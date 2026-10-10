import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@/generated/prisma/client';
import { protectedProcedure, router } from '../init';
import type {
  ArchiveOutcome,
  OwnerFieldEditRow,
  OwnerFieldRow,
} from '@/lib/fields/owner';
import type { LocalizedText } from '@/lib/i18n-content';
import { isOwnImageUrl } from '@/lib/server/cloudinary';
import { toLocalized } from '@/lib/server/translate';
import { createInput } from './field-submission';

const idInput = z.object({ id: z.string().min(1) });

const updateInput = createInput.extend({ id: z.string().min(1) });

const COORDINATE_EPSILON = 1e-6;

function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
}

function sameUrls(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((url, index) => url === b[index]);
}

async function resolveText(
  text: string,
  current: LocalizedText,
  lng: 'el' | 'en',
): Promise<{ value: LocalizedText; changed: boolean }> {
  if (text === current[lng]) return { value: current, changed: false };
  return { value: await toLocalized(text, lng), changed: true };
}

export const fieldOwnerRouter = router({
  list: protectedProcedure.query(async ({ ctx }): Promise<OwnerFieldRow[]> => {
    const fields = await ctx.prisma.field.findMany({
      where: { ownerId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        area: true,
        indoor: true,
        sports: true,
        status: true,
        rejectionReason: true,
        archivedAt: true,
        images: {
          orderBy: { order: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
    });

    const rows = fields.map((field) => ({
      id: field.id,
      name: asLocalized(field.name),
      area: asLocalized(field.area),
      indoor: field.indoor,
      sports: field.sports,
      status: field.status,
      rejectionReason:
        field.rejectionReason === null
          ? null
          : asLocalized(field.rejectionReason),
      archivedAt: field.archivedAt,
      imageUrl: field.images[0]?.url ?? null,
    }));

    return [
      ...rows.filter((row) => row.archivedAt === null),
      ...rows.filter((row) => row.archivedAt !== null),
    ];
  }),

  getForEdit: protectedProcedure
    .input(idInput)
    .query(async ({ ctx, input }): Promise<OwnerFieldEditRow> => {
      const field = await ctx.prisma.field.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
          archivedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          area: true,
          address: true,
          latitude: true,
          longitude: true,
          indoor: true,
          sports: true,
          status: true,
          rejectionReason: true,
          images: {
            orderBy: { order: 'asc' },
            select: { url: true },
          },
        },
      });

      if (!field) throw new TRPCError({ code: 'NOT_FOUND' });

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
        status: field.status,
        rejectionReason:
          field.rejectionReason === null
            ? null
            : asLocalized(field.rejectionReason),
        images: field.images.map((image) => image.url),
      };
    }),

  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.images.every(isOwnImageUrl)) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const field = await ctx.prisma.field.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.session.user.id,
          archivedAt: null,
        },
        select: {
          id: true,
          status: true,
          name: true,
          description: true,
          area: true,
          address: true,
          latitude: true,
          longitude: true,
          images: {
            orderBy: { order: 'asc' },
            select: { url: true },
          },
        },
      });

      if (!field) throw new TRPCError({ code: 'NOT_FOUND' });

      const [name, description, area] = await Promise.all([
        resolveText(input.name, asLocalized(field.name), input.lng),
        resolveText(
          input.description,
          asLocalized(field.description),
          input.lng,
        ),
        resolveText(input.area, asLocalized(field.area), input.lng),
      ]);

      const textChanged = name.changed || description.changed || area.changed;
      const imagesChanged = !sameUrls(
        input.images,
        field.images.map((image) => image.url),
      );
      const locationChanged =
        input.address !== field.address ||
        Math.abs(input.latitude - field.latitude) > COORDINATE_EPSILON ||
        Math.abs(input.longitude - field.longitude) > COORDINATE_EPSILON;

      const needsReview =
        field.status === 'REJECTED' ||
        textChanged ||
        imagesChanged ||
        locationChanged;

      await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.field.updateMany({
          where: { id: field.id, status: field.status, archivedAt: null },
          data: {
            name: name.value,
            description: description.value,
            area: area.value,
            address: input.address,
            latitude: input.latitude,
            longitude: input.longitude,
            indoor: input.indoor,
            sports: Array.from(new Set(input.sports)),
            ...(needsReview && {
              status: 'PENDING' as const,
              rejectionReason: Prisma.DbNull,
            }),
          },
        });
        if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

        if (imagesChanged) {
          await tx.fieldImage.deleteMany({ where: { fieldId: field.id } });
          await tx.fieldImage.createMany({
            data: input.images.map((url, order) => ({
              fieldId: field.id,
              url,
              order,
            })),
          });
        }
      });

      return { id: field.id, sentForReview: needsReview };
    }),

  archive: protectedProcedure
    .input(idInput)
    .mutation(async ({ ctx, input }): Promise<ArchiveOutcome> => {
      const field = await ctx.prisma.field.findFirst({
        where: { id: input.id, ownerId: ctx.session.user.id },
        select: { id: true, archivedAt: true },
      });

      if (!field) throw new TRPCError({ code: 'NOT_FOUND' });
      if (field.archivedAt) return { archived: true };

      return ctx.prisma.$transaction(async (tx) => {
        const now = new Date();

        const futureReservations = await tx.availabilitySlot.count({
          where: {
            fieldId: field.id,
            startTime: { gt: now },
            OR: [
              { reservation: { is: { status: 'CONFIRMED' } } },
              { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: now } },
            ],
          },
        });

        if (futureReservations > 0) {
          return { archived: false, futureReservations };
        }

        await tx.field.update({
          where: { id: field.id },
          data: { archivedAt: now },
        });

        return { archived: true };
      });
    }),
});
