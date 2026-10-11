import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, router } from '../init';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { SPORT_TYPES, type SportType } from '@/lib/fields/types';
import type { LocalizedText } from '@/lib/i18n-content';
import {
  resolveViewerState,
  TEAM_AREA_MAX,
  TEAM_DESCRIPTION_MAX,
  TEAM_LEVELS,
  TEAM_MAX_MEMBERS,
  TEAM_MIN_MEMBERS,
  TEAM_NAME_MAX,
  TEAM_POSITION_MAX,
  type JoinRequestRow,
  type TeamDetailRow,
  type TeamListRow,
  type TeamViewerState,
} from '@/lib/teams/team';
import type {
  TeamBookingOption,
  TeamReservationRow,
} from '@/lib/teams/team-booking';
import { asLocalized } from '@/lib/server/booking-shared';
import { createUploadSignature, isOwnImageUrl } from '@/lib/server/cloudinary';
import {
  joinRequestAcceptedMessage,
  joinRequestReceivedMessage,
  joinRequestRejectedMessage,
  leadershipTransferredMessage,
} from '@/lib/server/team-notifications';
import {
  buildSplitSummaries,
  cancelPendingSplitsForMember,
} from '@/lib/server/team-split';
import { toLocalized } from '@/lib/server/translate';

type Db = PrismaClient | Prisma.TransactionClient;

const languageInput = z.enum(['el', 'en']);

const teamFieldsInput = z.object({
  lng: languageInput,
  name: z.string().trim().min(1).max(TEAM_NAME_MAX),
  level: z.enum(TEAM_LEVELS),
  area: z.string().trim().min(1).max(TEAM_AREA_MAX),
  description: z.string().trim().max(TEAM_DESCRIPTION_MAX),
  maxMembers: z.number().int().min(TEAM_MIN_MEMBERS).max(TEAM_MAX_MEMBERS),
  isRecruiting: z.boolean(),
  neededPosition: z.string().trim().max(TEAM_POSITION_MAX),
  logoUrl: z.string().max(500).nullable(),
});

const createInput = teamFieldsInput.extend({
  sportType: z.enum(SPORT_TYPES),
});

const updateInput = teamFieldsInput.extend({ id: z.string().min(1) });

const listInput = z.object({
  sport: z.enum(SPORT_TYPES).nullable(),
  recruiting: z.boolean(),
});

const teamIdInput = z.object({ teamId: z.string().min(1) });
const requestIdInput = z.object({ requestId: z.string().min(1) });
const memberInput = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
});
const respondInput = z.object({
  requestId: z.string().min(1),
  accept: z.boolean(),
});

const listSelect = {
  id: true,
  name: true,
  area: true,
  sportType: true,
  level: true,
  logoUrl: true,
  isRecruiting: true,
  neededPosition: true,
  maxMembers: true,
  _count: { select: { members: true } },
} satisfies Prisma.TeamSelect;

type ListRecord = Prisma.TeamGetPayload<{ select: typeof listSelect }>;

function toListRow(record: ListRecord): TeamListRow {
  return {
    id: record.id,
    name: record.name,
    area: asLocalized(record.area),
    sportType: record.sportType,
    level: record.level,
    logoUrl: record.logoUrl,
    isRecruiting: record.isRecruiting,
    neededPosition: record.neededPosition,
    memberCount: record._count.members,
    maxMembers: record.maxMembers,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

async function assertLeader(
  db: Db,
  teamId: string,
  userId: string,
): Promise<void> {
  const membership = await db.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  if (membership?.role !== 'LEADER') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
}

async function localizeIfChanged(
  text: string,
  lng: 'el' | 'en',
  existing: LocalizedText | null,
): Promise<LocalizedText> {
  if (existing && existing[lng] === text && existing.el && existing.en) {
    return existing;
  }
  return toLocalized(text, lng);
}

function assertOwnLogo(logoUrl: string | null): void {
  if (logoUrl && !isOwnImageUrl(logoUrl)) {
    throw new TRPCError({ code: 'BAD_REQUEST' });
  }
}

export const teamsRouter = router({
  list: publicProcedure
    .input(listInput)
    .query(async ({ ctx, input }): Promise<TeamListRow[]> => {
      const records = await ctx.prisma.team.findMany({
        where: {
          ...(input.sport ? { sportType: input.sport } : {}),
          ...(input.recruiting ? { isRecruiting: true } : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: listSelect,
      });

      return records.map(toListRow);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(
      async ({
        ctx,
        input,
      }): Promise<{ team: TeamDetailRow; viewer: TeamViewerState }> => {
        const record = await ctx.prisma.team.findUnique({
          where: { id: input.id },
          select: {
            ...listSelect,
            description: true,
            createdAt: true,
            members: {
              orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
              select: {
                id: true,
                userId: true,
                role: true,
                joinedAt: true,
                user: { select: { name: true, image: true } },
              },
            },
          },
        });
        if (!record) throw new TRPCError({ code: 'NOT_FOUND' });

        const userId = ctx.session?.user.id ?? null;
        let pendingRequestId: string | null = null;
        let viewerSports: SportType[] = [];

        if (userId) {
          const [pending, memberships] = await Promise.all([
            ctx.prisma.joinRequest.findFirst({
              where: { teamId: record.id, userId, status: 'PENDING' },
              select: { id: true },
            }),
            ctx.prisma.teamMembership.findMany({
              where: { userId },
              select: { sportType: true },
            }),
          ]);
          pendingRequestId = pending?.id ?? null;
          viewerSports = memberships.map((item) => item.sportType);
        }

        const members = record.members.map((member) => ({
          membershipId: member.id,
          userId: member.userId,
          name: member.user.name,
          avatarUrl: member.user.image,
          role: member.role,
          joinedAt: member.joinedAt,
        }));

        return {
          team: {
            ...toListRow(record),
            description: record.description
              ? asLocalized(record.description)
              : null,
            createdAt: record.createdAt,
            members,
          },
          viewer: resolveViewerState({
            userId,
            members,
            maxMembers: record.maxMembers,
            pendingRequestId,
            viewerSports,
            sportType: record.sportType,
          }),
        };
      },
    ),

  joinRequests: protectedProcedure
    .input(teamIdInput)
    .query(async ({ ctx, input }): Promise<JoinRequestRow[]> => {
      await assertLeader(ctx.prisma, input.teamId, ctx.session.user.id);

      const requests = await ctx.prisma.joinRequest.findMany({
        where: { teamId: input.teamId, status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
      });

      return requests.map((request) => ({
        id: request.id,
        userId: request.userId,
        name: request.user.name,
        avatarUrl: request.user.image,
        createdAt: request.createdAt,
      }));
    }),

  myTeams: protectedProcedure.query(
    async ({
      ctx,
    }): Promise<(TeamListRow & { role: 'LEADER' | 'MEMBER' })[]> => {
      const memberships = await ctx.prisma.teamMembership.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { joinedAt: 'asc' },
        select: { role: true, team: { select: listSelect } },
      });

      return memberships.map((membership) => ({
        ...toListRow(membership.team),
        role: membership.role,
      }));
    },
  ),

  takenSports: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.prisma.teamMembership.findMany({
      where: { userId: ctx.session.user.id },
      select: { sportType: true },
    });

    return memberships.map((item) => item.sportType);
  }),

  bookableTeams: protectedProcedure
    .input(z.object({ sportType: z.enum(SPORT_TYPES) }))
    .query(async ({ ctx, input }): Promise<TeamBookingOption[]> => {
      const memberships = await ctx.prisma.teamMembership.findMany({
        where: {
          userId: ctx.session.user.id,
          role: 'LEADER',
          team: { sportType: input.sportType },
        },
        orderBy: { joinedAt: 'asc' },
        select: { team: { select: listSelect } },
      });

      return memberships.map(({ team }) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        sportType: team.sportType,
        memberCount: team._count.members,
        maxMembers: team.maxMembers,
      }));
    }),

  upcomingReservations: protectedProcedure
    .input(teamIdInput)
    .query(async ({ ctx, input }): Promise<TeamReservationRow[]> => {
      const membership = await ctx.prisma.teamMembership.findUnique({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: ctx.session.user.id,
          },
        },
        select: { id: true },
      });
      if (!membership) throw new TRPCError({ code: 'FORBIDDEN' });

      const reservations = await ctx.prisma.reservation.findMany({
        where: {
          teamId: input.teamId,
          status: 'CONFIRMED',
          slot: { endTime: { gt: new Date() } },
        },
        orderBy: { slot: { startTime: 'asc' } },
        select: {
          id: true,
          userId: true,
          user: { select: { name: true } },
          slot: {
            select: {
              startTime: true,
              endTime: true,
              field: { select: { id: true, name: true } },
            },
          },
        },
      });

      const summaries = await buildSplitSummaries(ctx.prisma, {
        viewerId: ctx.session.user.id,
        reservations: reservations.map((reservation) => ({
          id: reservation.id,
          userId: reservation.userId,
          payerName: reservation.user.name,
        })),
      });

      return reservations.map((reservation) => ({
        id: reservation.id,
        fieldId: reservation.slot.field.id,
        fieldName: asLocalized(reservation.slot.field.name),
        startTime: reservation.slot.startTime,
        endTime: reservation.slot.endTime,
        bookedBy: reservation.user.name,
        split: summaries.get(reservation.id) ?? null,
      }));
    }),

  uploadSignature: protectedProcedure.mutation(() => createUploadSignature()),

  create: protectedProcedure
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      assertOwnLogo(input.logoUrl);

      const [area, description] = await Promise.all([
        toLocalized(input.area, input.lng),
        input.description ? toLocalized(input.description, input.lng) : null,
      ]);

      try {
        return await ctx.prisma.team.create({
          data: {
            name: input.name,
            sportType: input.sportType,
            level: input.level,
            area,
            ...(description ? { description } : {}),
            logoUrl: input.logoUrl,
            maxMembers: input.maxMembers,
            isRecruiting: input.isRecruiting,
            neededPosition: input.neededPosition || null,
            members: {
              create: {
                userId: ctx.session.user.id,
                sportType: input.sportType,
                role: 'LEADER',
              },
            },
          },
          select: { id: true },
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({ code: 'CONFLICT' });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(updateInput)
    .mutation(async ({ ctx, input }) => {
      assertOwnLogo(input.logoUrl);
      await assertLeader(ctx.prisma, input.id, ctx.session.user.id);

      const current = await ctx.prisma.team.findUnique({
        where: { id: input.id },
        select: {
          area: true,
          description: true,
          _count: { select: { members: true } },
        },
      });
      if (!current) throw new TRPCError({ code: 'NOT_FOUND' });
      if (input.maxMembers < current._count.members) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const [area, description] = await Promise.all([
        localizeIfChanged(input.area, input.lng, asLocalized(current.area)),
        input.description
          ? localizeIfChanged(
              input.description,
              input.lng,
              current.description ? asLocalized(current.description) : null,
            )
          : null,
      ]);

      await ctx.prisma.team.update({
        where: { id: input.id },
        data: {
          name: input.name,
          level: input.level,
          area,
          description: description ?? Prisma.DbNull,
          logoUrl: input.logoUrl,
          maxMembers: input.maxMembers,
          isRecruiting: input.isRecruiting,
          neededPosition: input.neededPosition || null,
        },
      });

      return { id: input.id };
    }),

  requestJoin: protectedProcedure
    .input(teamIdInput)
    .mutation(({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const userId = ctx.session.user.id;

        const team = await tx.team.findUnique({
          where: { id: input.teamId },
          select: {
            id: true,
            name: true,
            sportType: true,
            maxMembers: true,
            _count: { select: { members: true } },
            members: {
              where: { role: 'LEADER' },
              select: { userId: true },
            },
          },
        });
        if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
        if (team._count.members >= team.maxMembers) {
          throw new TRPCError({ code: 'CONFLICT' });
        }

        const [sameSport, pending] = await Promise.all([
          tx.teamMembership.findFirst({
            where: {
              userId,
              OR: [{ sportType: team.sportType }, { teamId: team.id }],
            },
            select: { id: true },
          }),
          tx.joinRequest.findFirst({
            where: { teamId: team.id, userId, status: 'PENDING' },
            select: { id: true },
          }),
        ]);
        if (sameSport || pending) throw new TRPCError({ code: 'CONFLICT' });

        const request = await tx.joinRequest.create({
          data: { teamId: team.id, userId },
          select: { id: true },
        });

        const leader = team.members[0];
        if (leader) {
          await tx.notification.create({
            data: {
              userId: leader.userId,
              type: 'JOIN_REQUEST_RECEIVED',
              message: joinRequestReceivedMessage(
                ctx.session.user.name,
                team.name,
              ),
              linkUrl: `/teams/${team.id}/manage`,
            },
          });
        }

        return request;
      }),
    ),

  cancelRequest: protectedProcedure
    .input(requestIdInput)
    .mutation(async ({ ctx, input }) => {
      const cancelled = await ctx.prisma.joinRequest.updateMany({
        where: {
          id: input.requestId,
          userId: ctx.session.user.id,
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
      if (cancelled.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      return { id: input.requestId };
    }),

  respond: protectedProcedure
    .input(respondInput)
    .mutation(async ({ ctx, input }) => {
      const outcome = await ctx.prisma.$transaction(async (tx) => {
        const request = await tx.joinRequest.findUnique({
          where: { id: input.requestId },
          select: {
            id: true,
            userId: true,
            teamId: true,
            team: {
              select: {
                id: true,
                name: true,
                sportType: true,
                maxMembers: true,
              },
            },
          },
        });
        if (!request) throw new TRPCError({ code: 'NOT_FOUND' });

        await assertLeader(tx, request.teamId, ctx.session.user.id);

        const claimed = await tx.joinRequest.updateMany({
          where: { id: request.id, status: 'PENDING' },
          data: { status: input.accept ? 'ACCEPTED' : 'REJECTED' },
        });
        if (claimed.count === 0) throw new TRPCError({ code: 'CONFLICT' });

        if (!input.accept) {
          await tx.notification.create({
            data: {
              userId: request.userId,
              type: 'JOIN_REQUEST_REJECTED',
              message: joinRequestRejectedMessage(request.team.name),
              linkUrl: '/teams',
            },
          });
          return 'rejected' as const;
        }

        const [memberCount, sportTaken] = await Promise.all([
          tx.teamMembership.count({ where: { teamId: request.teamId } }),
          tx.teamMembership.findFirst({
            where: {
              userId: request.userId,
              sportType: request.team.sportType,
            },
            select: { id: true },
          }),
        ]);

        if (sportTaken) {
          await tx.joinRequest.update({
            where: { id: request.id },
            data: { status: 'REJECTED' },
          });
          return 'sport_taken' as const;
        }
        if (memberCount >= request.team.maxMembers) {
          throw new TRPCError({ code: 'CONFLICT' });
        }

        await tx.teamMembership.create({
          data: {
            teamId: request.teamId,
            userId: request.userId,
            sportType: request.team.sportType,
          },
        });

        await tx.joinRequest.updateMany({
          where: {
            userId: request.userId,
            status: 'PENDING',
            id: { not: request.id },
            team: { sportType: request.team.sportType },
          },
          data: { status: 'CANCELLED' },
        });

        await tx.notification.create({
          data: {
            userId: request.userId,
            type: 'JOIN_REQUEST_ACCEPTED',
            message: joinRequestAcceptedMessage(request.team.name),
            linkUrl: `/teams/${request.teamId}`,
          },
        });

        return 'accepted' as const;
      });

      if (outcome === 'sport_taken') throw new TRPCError({ code: 'CONFLICT' });

      return { status: outcome };
    }),

  leave: protectedProcedure
    .input(teamIdInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const left = await tx.teamMembership.deleteMany({
          where: {
            teamId: input.teamId,
            userId: ctx.session.user.id,
            role: 'MEMBER',
          },
        });
        if (left.count === 0) throw new TRPCError({ code: 'CONFLICT' });

        await cancelPendingSplitsForMember(
          tx,
          input.teamId,
          ctx.session.user.id,
        );
      });

      return { id: input.teamId };
    }),

  removeMember: protectedProcedure
    .input(memberInput)
    .mutation(async ({ ctx, input }) => {
      await assertLeader(ctx.prisma, input.teamId, ctx.session.user.id);

      await ctx.prisma.$transaction(async (tx) => {
        const removed = await tx.teamMembership.deleteMany({
          where: { teamId: input.teamId, userId: input.userId, role: 'MEMBER' },
        });
        if (removed.count === 0) throw new TRPCError({ code: 'CONFLICT' });

        await cancelPendingSplitsForMember(tx, input.teamId, input.userId);
      });

      return { id: input.userId };
    }),

  transferLeadership: protectedProcedure
    .input(memberInput)
    .mutation(({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const callerId = ctx.session.user.id;
        if (input.userId === callerId) {
          throw new TRPCError({ code: 'BAD_REQUEST' });
        }

        const demoted = await tx.teamMembership.updateMany({
          where: { teamId: input.teamId, userId: callerId, role: 'LEADER' },
          data: { role: 'MEMBER' },
        });
        if (demoted.count === 0) throw new TRPCError({ code: 'FORBIDDEN' });

        const promoted = await tx.teamMembership.updateMany({
          where: { teamId: input.teamId, userId: input.userId, role: 'MEMBER' },
          data: { role: 'LEADER' },
        });
        if (promoted.count === 0) throw new TRPCError({ code: 'CONFLICT' });

        const team = await tx.team.findUnique({
          where: { id: input.teamId },
          select: { name: true },
        });

        await tx.notification.create({
          data: {
            userId: input.userId,
            type: 'LEADERSHIP_TRANSFERRED',
            message: leadershipTransferredMessage(team?.name ?? ''),
            linkUrl: `/teams/${input.teamId}/manage`,
          },
        });

        return { id: input.userId };
      }),
    ),

  delete: protectedProcedure.input(teamIdInput).mutation(({ ctx, input }) =>
    ctx.prisma.$transaction(async (tx) => {
      await assertLeader(tx, input.teamId, ctx.session.user.id);

      const [members, reservations, tournaments, sessions] = await Promise.all([
        tx.teamMembership.count({ where: { teamId: input.teamId } }),
        tx.reservation.count({ where: { teamId: input.teamId } }),
        tx.tournamentTeam.count({ where: { teamId: input.teamId } }),
        tx.coachingSession.count({ where: { teamId: input.teamId } }),
      ]);
      if (members > 1 || reservations + tournaments + sessions > 0) {
        throw new TRPCError({ code: 'CONFLICT' });
      }

      await tx.team.delete({ where: { id: input.teamId } });

      return { id: input.teamId };
    }),
  ),
});
