import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../init';
import {
  ADDRESS_MAX,
  AREA_MAX,
  DESCRIPTION_MAX,
  MAX_IMAGES,
  NAME_MAX,
} from '@/lib/fields/new-field';
import { SPORT_TYPES } from '@/lib/fields/types';
import { createUploadSignature, isOwnImageUrl } from '@/lib/server/cloudinary';
import { searchAddress } from '@/lib/server/geocode';
import { toLocalized } from '@/lib/server/translate';

const languageInput = z.enum(['el', 'en']);

const geocodeInput = z.object({
  query: z.string().trim().min(3).max(ADDRESS_MAX),
  lng: languageInput,
});

export const createInput = z.object({
  lng: languageInput,
  name: z.string().trim().min(1).max(NAME_MAX),
  description: z.string().trim().min(1).max(DESCRIPTION_MAX),
  area: z.string().trim().min(1).max(AREA_MAX),
  address: z.string().trim().min(1).max(ADDRESS_MAX),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  indoor: z.boolean(),
  sports: z.array(z.enum(SPORT_TYPES)).min(1),
  images: z.array(z.string().max(500)).min(1).max(MAX_IMAGES),
});

export const fieldSubmissionRouter = router({
  geocode: protectedProcedure
    .input(geocodeInput)
    .mutation(async ({ input }) => {
      try {
        return await searchAddress(input.query, input.lng);
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
    }),

  uploadSignature: protectedProcedure.mutation(() => createUploadSignature()),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      if (!input.images.every(isOwnImageUrl)) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const [name, description, area] = await Promise.all([
        toLocalized(input.name, input.lng),
        toLocalized(input.description, input.lng),
        toLocalized(input.area, input.lng),
      ]);

      return ctx.prisma.field.create({
        data: {
          ownerId: ctx.session.user.id,
          name,
          description,
          area,
          sports: Array.from(new Set(input.sports)),
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          indoor: input.indoor,
          images: {
            create: input.images.map((url, order) => ({ url, order })),
          },
        },
        select: { id: true },
      });
    }),
});
