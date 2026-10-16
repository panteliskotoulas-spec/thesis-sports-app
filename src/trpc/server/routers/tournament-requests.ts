import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../init';
import { Prisma } from '@/generated/prisma/client';
import {
  teamRequestAcceptedMessage,
  teamRequestReceivedMessage,
  teamRequestRejectedMessage,
} from '@/lib/server/tournament-notifications';
import type {
  TeamRequestItem,
  TeamRequestViewer,
} from '@/lib/tournaments/team-request';

type Tx = Prisma.TransactionClient;

async function leaderIds(tx: Tx, teamId: string): Promise<string[]> {
  const leaders = await tx.teamMembership.findMany({
    where: { teamId, role: 'LEADER' },
    select: { userId: true },
  });
  return leaders.map((leader) => leader.userId);
}

export const tournamentRequestsRouter = router({
  viewer: publicProcedure
    .input(z.object({ tournamentId: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<TeamRequestViewer> => {
      const hidden: TeamRequestViewer = { kind: 'hidden' };
      if (!ctx.session) return hidden;

      const tournament = await ctx.prisma.tournament.findUnique({
        where: { id: input.tournamentId },
        select: {
          sportType: true,
          status: true,
          maxTeams: true,
          _count: { select: { teams: true, matches: true } },
        },
      });
      if (!tournament) return hidden;
      if (tournament.status !== 'UPCOMING' || tournament._count.matches > 0) {
        return hidden;
      }

      const membership = await ctx.prisma.teamMembership.findUnique({
        where: {
          userId_sportType: {
            userId: ctx.session.user.id,
            sportType: tournament.sportType,
          },
        },
        select: { role: true, team: { select: { id: true, name: true } } },
      });
      if (!membership || membership.role !== 'LEADER') return hidden;

      const team = membership.team;

      const joined = await ctx.prisma.tournamentTeam.findUnique({
        where: {
          tournamentId_teamId: {
            tournamentId: input.tournamentId,
            teamId: team.id,
          },
        },
        select: { id: true },
      });
      if (joined) return hidden;

      const request = await ctx.prisma.tournamentTeamRequest.findUnique({
        where: {
          tournamentId_teamId: {
            tournamentId: input.tournamentId,
            teamId: team.id,
          },
        },
        select: { id: true, status: true, createdAt: true },
      });

      if (request) {
        if (request.status === 'PENDING') {
          return {
            kind: 'pending',
            requestId: request.id,
            teamName: team.name,
            createdAt: request.createdAt.toISOString(),
          };
        }
        return { kind: 'rejected', teamName: team.name };
      }

      if (tournament._count.teams >= tournament.maxTeams) {
        return { kind: 'full', teamName: team.name };
      }

      return { kind: 'open', team: { id: team.id, name: team.name } };
    }),

  list: adminProcedure
    .input(z.object({ tournamentId: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<TeamRequestItem[]> => {
      const rows = await ctx.prisma.tournamentTeamRequest.findMany({
        where: { tournamentId: input.tournamentId, status: 'PENDING' },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          createdAt: true,
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              _count: { select: { members: true } },
              members: {
                where: { role: 'LEADER' },
                take: 1,
                select: { user: { select: { name: true } } },
              },
            },
          },
        },
      });

      return rows.map((row) => ({
        id: row.id,
        teamId: row.team.id,
        teamName: row.team.name,
        teamLogoUrl: row.team.logoUrl,
        leaderName: row.team.members[0]?.user.name ?? '',
        memberCount: row.team._count.members,
        createdAt: row.createdAt.toISOString(),
      }));
    }),

  submit: protectedProcedure
    .input(
      z.object({ tournamentId: z.string().min(1), teamId: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        const created = await ctx.prisma.$transaction(async (tx) => {
          const tournament = await tx.tournament.findUnique({
            where: { id: input.tournamentId },
            select: {
              name: true,
              sportType: true,
              status: true,
              maxTeams: true,
              organizerId: true,
              _count: { select: { teams: true, matches: true } },
            },
          });
          if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' });
          if (
            tournament.status !== 'UPCOMING' ||
            tournament._count.matches > 0
          ) {
            throw new TRPCError({ code: 'CONFLICT' });
          }

          const membership = await tx.teamMembership.findUnique({
            where: {
              userId_sportType: { userId, sportType: tournament.sportType },
            },
            select: {
              role: true,
              teamId: true,
              team: { select: { name: true } },
            },
          });
          if (
            !membership ||
            membership.role !== 'LEADER' ||
            membership.teamId !== input.teamId
          ) {
            throw new TRPCError({ code: 'FORBIDDEN' });
          }

          const joined = await tx.tournamentTeam.findUnique({
            where: {
              tournamentId_teamId: {
                tournamentId: input.tournamentId,
                teamId: input.teamId,
              },
            },
            select: { id: true },
          });
          if (joined) throw new TRPCError({ code: 'CONFLICT' });

          if (tournament._count.teams >= tournament.maxTeams) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'TOURNAMENT_FULL',
            });
          }

          const request = await tx.tournamentTeamRequest.create({
            data: { tournamentId: input.tournamentId, teamId: input.teamId },
            select: { id: true },
          });

          await tx.notification.create({
            data: {
              userId: tournament.organizerId,
              type: 'TOURNAMENT_REQUEST_RECEIVED',
              message: teamRequestReceivedMessage(
                membership.team.name,
                tournament.name,
              ),
              linkUrl: `/admin/tournaments/${input.tournamentId}`,
            },
          });

          return request;
        });

        return { id: created.id, tournamentId: input.tournamentId };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new TRPCError({ code: 'CONFLICT' });
        }
        throw error;
      }
    }),

  cancel: protectedProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.tournamentTeamRequest.findUnique({
        where: { id: input.requestId },
        select: { teamId: true, tournamentId: true },
      });
      if (!request) throw new TRPCError({ code: 'NOT_FOUND' });

      const leader = await ctx.prisma.teamMembership.findFirst({
        where: {
          teamId: request.teamId,
          userId: ctx.session.user.id,
          role: 'LEADER',
        },
        select: { id: true },
      });
      if (!leader) throw new TRPCError({ code: 'FORBIDDEN' });

      const removed = await ctx.prisma.tournamentTeamRequest.deleteMany({
        where: { id: input.requestId, status: 'PENDING' },
      });
      if (removed.count === 0) throw new TRPCError({ code: 'CONFLICT' });

      return { id: input.requestId, tournamentId: request.tournamentId };
    }),

  accept: adminProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const tournamentId = await ctx.prisma.$transaction(async (tx) => {
          const request = await tx.tournamentTeamRequest.findUnique({
            where: { id: input.requestId },
            select: {
              status: true,
              tournamentId: true,
              teamId: true,
              team: { select: { name: true, sportType: true } },
              tournament: {
                select: {
                  name: true,
                  sportType: true,
                  status: true,
                  maxTeams: true,
                  _count: { select: { teams: true, matches: true } },
                },
              },
            },
          });
          if (!request) throw new TRPCError({ code: 'NOT_FOUND' });
          if (request.status !== 'PENDING') {
            throw new TRPCError({ code: 'CONFLICT' });
          }

          const tournament = request.tournament;
          if (
            tournament.status !== 'UPCOMING' ||
            tournament._count.matches > 0
          ) {
            throw new TRPCError({ code: 'CONFLICT' });
          }
          if (tournament._count.teams >= tournament.maxTeams) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'TOURNAMENT_FULL',
            });
          }
          if (request.team.sportType !== tournament.sportType) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'SPORT_MISMATCH',
            });
          }

          await tx.tournamentTeam.create({
            data: {
              tournamentId: request.tournamentId,
              teamId: request.teamId,
            },
          });
          await tx.tournamentTeamRequest.delete({
            where: { id: input.requestId },
          });

          const recipients = await leaderIds(tx, request.teamId);
          if (recipients.length > 0) {
            await tx.notification.createMany({
              data: recipients.map((userId) => ({
                userId,
                type: 'TOURNAMENT_REQUEST_ACCEPTED' as const,
                message: teamRequestAcceptedMessage(
                  request.team.name,
                  tournament.name,
                ),
                linkUrl: `/tournaments/${request.tournamentId}`,
              })),
            });
          }

          return request.tournamentId;
        });

        return { id: input.requestId, tournamentId };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new TRPCError({ code: 'CONFLICT' });
        }
        throw error;
      }
    }),

  reject: adminProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const tournamentId = await ctx.prisma.$transaction(async (tx) => {
        const request = await tx.tournamentTeamRequest.findUnique({
          where: { id: input.requestId },
          select: {
            tournamentId: true,
            teamId: true,
            team: { select: { name: true } },
            tournament: { select: { name: true } },
          },
        });
        if (!request) throw new TRPCError({ code: 'NOT_FOUND' });

        const updated = await tx.tournamentTeamRequest.updateMany({
          where: { id: input.requestId, status: 'PENDING' },
          data: { status: 'REJECTED' },
        });
        if (updated.count === 0) throw new TRPCError({ code: 'CONFLICT' });

        const recipients = await leaderIds(tx, request.teamId);
        if (recipients.length > 0) {
          await tx.notification.createMany({
            data: recipients.map((userId) => ({
              userId,
              type: 'TOURNAMENT_REQUEST_REJECTED' as const,
              message: teamRequestRejectedMessage(
                request.team.name,
                request.tournament.name,
              ),
              linkUrl: `/tournaments/${request.tournamentId}`,
            })),
          });
        }

        return request.tournamentId;
      });

      return { id: input.requestId, tournamentId };
    }),
});
