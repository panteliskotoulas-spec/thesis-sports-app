import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, router } from '../init';
import {
  FIELD_STATUSES,
  REJECTION_REASON_MAX,
  type FieldApprovalList,
  type FieldStatusValue,
} from '@/lib/fields/approval';
import type { LocalizedText } from '@/lib/i18n-content';
import {
  approvedMessage,
  rejectedMessage,
} from '@/lib/server/field-notifications';
import { toLocalized } from '@/lib/server/translate';

const languageInput = z.enum(['el', 'en']);

const idInput = z.object({ id: z.string().min(1) });

const rejectInput = idInput.extend({
  lng: languageInput,
  reason: z.string().trim().max(REJECTION_REASON_MAX),
});

function asLocalized(value: unknown): LocalizedText {
  const record = (value ?? {}) as Partial<LocalizedText>;
  return { el: record.el ?? '', en: record.en ?? '' };
}

export const fieldApprovalRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(FIELD_STATUSES) }))
    .query(async ({ ctx, input }): Promise<FieldApprovalList> => {
      const [fields, grouped] = await Promise.all([
        ctx.prisma.field.findMany({
          where: { status: input.status },
          orderBy: { createdAt: input.status === 'PENDING' ? 'asc' : 'desc' },
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
            createdAt: true,
            images: {
              orderBy: { order: 'asc' },
              select: { url: true },
            },
            owner: {
              select: { name: true, accountType: true, businessName: true },
            },
          },
        }),
        ctx.prisma.field.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ]);

      const counts: Record<FieldStatusValue, number> = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
      };
      for (const entry of grouped) {
        counts[entry.status] = entry._count._all;
      }

      return {
        counts,
        fields: fields.map((field) => ({
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
          createdAt: field.createdAt,
          images: field.images.map((image) => image.url),
          owner: {
            name: field.owner.name,
            business: field.owner.accountType === 'BUSINESS',
            businessName: field.owner.businessName,
          },
        })),
      };
    }),

  approve: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const field = await ctx.prisma.field.findUnique({
      where: { id: input.id },
      select: { id: true, ownerId: true, name: true },
    });
    if (!field) throw new TRPCError({ code: 'NOT_FOUND' });

    await ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.field.updateMany({
        where: { id: field.id, status: 'PENDING' },
        data: { status: 'APPROVED' },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.notification.create({
        data: {
          userId: field.ownerId,
          type: 'FIELD_LISTING_APPROVED',
          message: approvedMessage(asLocalized(field.name)),
          linkUrl: `/fields/${field.id}`,
        },
      });
    });

    return { id: field.id };
  }),

  reject: adminProcedure.input(rejectInput).mutation(async ({ ctx, input }) => {
    const field = await ctx.prisma.field.findUnique({
      where: { id: input.id },
      select: { id: true, ownerId: true, name: true },
    });
    if (!field) throw new TRPCError({ code: 'NOT_FOUND' });

    const reason = input.reason
      ? await toLocalized(input.reason, input.lng)
      : null;

    await ctx.prisma.$transaction(async (tx) => {
      const updated = await tx.field.updateMany({
        where: { id: field.id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          ...(reason && { rejectionReason: reason }),
        },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      await tx.notification.create({
        data: {
          userId: field.ownerId,
          type: 'FIELD_LISTING_REJECTED',
          message: rejectedMessage(asLocalized(field.name), reason),
          linkUrl: `/fields/${field.id}`,
        },
      });
    });

    return { id: field.id };
  }),
});
