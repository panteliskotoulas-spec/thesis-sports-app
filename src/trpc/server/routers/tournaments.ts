import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../init';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { localized } from '@/lib/i18n-content';
import { asLocalized } from '@/lib/server/booking-shared';
import { athensDateTime, athensDayStart } from '@/lib/server/athens-time';
import { matchResultMessage } from '@/lib/server/tournament-notifications';
import { toLocalized } from '@/lib/server/translate';
import { toAthensParts } from '@/lib/tournaments/admin';
import { buildDetail, type RawTournament } from '@/lib/tournaments/aggregate';
import { generateRoundRobin } from '@/lib/tournaments/fixtures';
import { checkResult, type ResultErrorCode } from '@/lib/tournaments/result';
import {
  TOURNAMENT_SPORTS,
  TOURNAMENT_STATUSES,
  isTournamentSport,
  isTournamentStatus,
  type TournamentDetail,
  type TournamentListItem,
} from '@/lib/tournaments/tournament';

const NAME_MAX = 80;
const DESCRIPTION_MAX = 1000;
const MIN_TEAMS = 2;
const MAX_TEAMS = 16;

const languageInput = z.enum(['el', 'en']);
const dayInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeInput = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const tournamentFieldsInput = z.object({
  lng: languageInput,
  name: z.string().trim().min(1).max(NAME_MAX),
  hostFieldId: z.string().min(1),
  startDay: dayInput,
  endDay: dayInput,
  maxTeams: z.number().int().min(MIN_TEAMS).max(MAX_TEAMS),
  description: z.string().trim().max(DESCRIPTION_MAX),
});

const createInput = tournamentFieldsInput.extend({
  sport: z.enum(TOURNAMENT_SPORTS),
});

const updateInput = tournamentFieldsInput.extend({ id: z.string().min(1) });

const resultInput = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().nullable(),
  awayScore: z.number().int().nullable(),
  sets: z
    .array(z.tuple([z.number().int(), z.number().int()]))
    .max(5)
    .nullable(),
  players: z
    .array(
      z.object({
        userId: z.string().min(1),
        teamId: z.string().min(1),
        stats: z.record(z.string(), z.number()),
      }),
    )
    .max(60),
});

async function descriptionFor(text: string, lng: 'el' | 'en') {
  return text ? toLocalized(text, lng) : { el: '', en: '' };
}

function isDayOrder(startDay: string, endDay: string): boolean {
  return startDay <= endDay;
}

function resultError(code: ResultErrorCode): TRPCError {
  return new TRPCError({ code: 'BAD_REQUEST', message: code });
}

async function assertHostField(
  prisma: PrismaClient | Prisma.TransactionClient,
  fieldId: string,
  sport: (typeof TOURNAMENT_SPORTS)[number],
) {
  const field = await prisma.field.findFirst({
    where: {
      id: fieldId,
      status: 'APPROVED',
      archivedAt: null,
      sports: { has: sport },
    },
    select: { id: true },
  });
  if (!field)
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'FIELD_INVALID' });
}

const rawSelect = {
  id: true,
  name: true,
  sportType: true,
  status: true,
  startDate: true,
  endDate: true,
  maxTeams: true,
  description: true,
  hostField: { select: { name: true } },
  teams: {
    orderBy: { id: 'asc' },
    select: { team: { select: { id: true, name: true } } },
  },
  matches: {
    orderBy: [{ round: 'asc' }, { scheduledAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      round: true,
      homeTeamId: true,
      awayTeamId: true,
      status: true,
      scheduledAt: true,
      homeScore: true,
      awayScore: true,
      sets: true,
      playerStats: {
        select: {
          userId: true,
          teamId: true,
          stats: true,
          user: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.TournamentSelect;

type TournamentRow = Prisma.TournamentGetPayload<{ select: typeof rawSelect }>;

function toRaw(row: TournamentRow, lng: string): RawTournament | null {
  if (!isTournamentSport(row.sportType) || !isTournamentStatus(row.status)) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    sport: row.sportType,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    maxTeams: row.maxTeams,
    description: localized(asLocalized(row.description), lng),
    fieldName: localized(asLocalized(row.hostField.name), lng),
    teams: row.teams.map((entry) => entry.team),
    matches: row.matches.map((match) => ({
      id: match.id,
      round: match.round,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      status: match.status,
      scheduledAt: match.scheduledAt,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      sets: match.sets,
      statRows: match.playerStats.map((stat) => ({
        userId: stat.userId,
        userName: stat.user.name,
        teamId: stat.teamId,
        stats: stat.stats,
      })),
    })),
  };
}

type ListFilters = {
  lng: 'el' | 'en';
  sport: (typeof TOURNAMENT_SPORTS)[number] | null;
  status: (typeof TOURNAMENT_STATUSES)[number] | null;
};

async function listTournaments(
  prisma: Prisma.TransactionClient,
  extraWhere: Prisma.TournamentWhereInput,
  input: ListFilters,
): Promise<TournamentListItem[]> {
  const rows = await prisma.tournament.findMany({
    where: {
      ...extraWhere,
      sportType: input.sport ?? { in: [...TOURNAMENT_SPORTS] },
      ...(input.status && { status: input.status }),
    },
    orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      sportType: true,
      status: true,
      startDate: true,
      endDate: true,
      maxTeams: true,
      hostField: { select: { name: true } },
      _count: { select: { teams: true } },
    },
  });

  const items: TournamentListItem[] = [];
  for (const row of rows) {
    if (!isTournamentSport(row.sportType) || !isTournamentStatus(row.status)) {
      continue;
    }
    items.push({
      id: row.id,
      name: row.name,
      sport: row.sportType,
      status: row.status,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      fieldName: localized(asLocalized(row.hostField.name), input.lng),
      teamCount: row._count.teams,
      maxTeams: row.maxTeams,
    });
  }
  return items;
}

export const tournamentsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        lng: languageInput,
        sport: z.enum(TOURNAMENT_SPORTS).nullable(),
        status: z.enum(TOURNAMENT_STATUSES).nullable(),
      }),
    )
    .query(
      async ({ ctx, input }): Promise<TournamentListItem[]> =>
        listTournaments(ctx.prisma, {}, input),
    ),

  listMine: protectedProcedure
    .input(
      z.object({
        lng: languageInput,
        sport: z.enum(TOURNAMENT_SPORTS).nullable(),
        status: z.enum(TOURNAMENT_STATUSES).nullable(),
      }),
    )
    .query(async ({ ctx, input }): Promise<TournamentListItem[]> => {
      const userId = ctx.session.user.id;
      const ownTeam = { members: { some: { userId } } };
      return listTournaments(
        ctx.prisma,
        {
          OR: [
            { teams: { some: { team: ownTeam } } },
            {
              teamRequests: {
                some: { status: 'PENDING', team: ownTeam },
              },
            },
          ],
        },
        input,
      );
    }),

  detail: publicProcedure
    .input(z.object({ id: z.string().min(1), lng: languageInput }))
    .query(async ({ ctx, input }): Promise<TournamentDetail | null> => {
      const row = await ctx.prisma.tournament.findUnique({
        where: { id: input.id },
        select: rawSelect,
      });
      if (!row) return null;
      const raw = toRaw(row, input.lng);
      return raw ? buildDetail(raw) : null;
    }),

  editValues: adminProcedure
    .input(z.object({ id: z.string().min(1), lng: languageInput }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.prisma.tournament.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          sportType: true,
          status: true,
          hostFieldId: true,
          startDate: true,
          endDate: true,
          maxTeams: true,
          description: true,
        },
      });
      if (
        !row ||
        !isTournamentSport(row.sportType) ||
        !isTournamentStatus(row.status)
      ) {
        return null;
      }

      return {
        id: row.id,
        status: row.status,
        sport: row.sportType,
        values: {
          name: row.name,
          sport: row.sportType,
          hostFieldId: row.hostFieldId,
          startDay: toAthensParts(row.startDate.toISOString()).day,
          endDay: toAthensParts(row.endDate.toISOString()).day,
          maxTeams: String(row.maxTeams),
          description: localized(asLocalized(row.description), input.lng),
        },
      };
    }),

  create: adminProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    if (!isDayOrder(input.startDay, input.endDay)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'DATES_INVALID' });
    }
    const description = await descriptionFor(input.description, input.lng);

    const created = await ctx.prisma.$transaction(async (tx) => {
      await assertHostField(tx, input.hostFieldId, input.sport);
      return tx.tournament.create({
        data: {
          name: input.name,
          sportType: input.sport,
          hostFieldId: input.hostFieldId,
          organizerId: ctx.session.user.id,
          startDate: athensDayStart(input.startDay),
          endDate: athensDayStart(input.endDay),
          maxTeams: input.maxTeams,
          description,
        },
        select: { id: true },
      });
    });

    return { id: created.id };
  }),

  update: adminProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    if (!isDayOrder(input.startDay, input.endDay)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'DATES_INVALID' });
    }
    const description = await descriptionFor(input.description, input.lng);

    await ctx.prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: input.id },
        select: {
          sportType: true,
          status: true,
          _count: { select: { teams: true } },
        },
      });
      if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' });
      if (tournament.status === 'COMPLETED') {
        throw new TRPCError({ code: 'CONFLICT' });
      }
      if (input.maxTeams < tournament._count.teams) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'MAX_TEAMS_BELOW_COUNT',
        });
      }
      if (!isTournamentSport(tournament.sportType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'SPORT_UNSUPPORTED',
        });
      }
      await assertHostField(tx, input.hostFieldId, tournament.sportType);

      await tx.tournament.update({
        where: { id: input.id },
        data: {
          name: input.name,
          hostFieldId: input.hostFieldId,
          startDate: athensDayStart(input.startDay),
          endDate: athensDayStart(input.endDay),
          maxTeams: input.maxTeams,
          description,
        },
      });
    });

    return { id: input.id };
  }),

  remove: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: input.id },
          select: { id: true },
        });
        if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' });

        const completed = await tx.match.count({
          where: { tournamentId: input.id, status: 'COMPLETED' },
        });
        if (completed > 0) throw new TRPCError({ code: 'CONFLICT' });

        await tx.match.deleteMany({ where: { tournamentId: input.id } });
        await tx.tournamentTeam.deleteMany({
          where: { tournamentId: input.id },
        });
        await tx.tournament.delete({ where: { id: input.id } });
      });

      return { id: input.id };
    }),

  addTeam: adminProcedure
    .input(
      z.object({ tournamentId: z.string().min(1), teamId: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.$transaction(async (tx) => {
          const tournament = await tx.tournament.findUnique({
            where: { id: input.tournamentId },
            select: {
              sportType: true,
              status: true,
              maxTeams: true,
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
          if (tournament._count.teams >= tournament.maxTeams) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'TOURNAMENT_FULL',
            });
          }

          const team = await tx.team.findUnique({
            where: { id: input.teamId },
            select: { sportType: true },
          });
          if (!team) throw new TRPCError({ code: 'NOT_FOUND' });
          if (team.sportType !== tournament.sportType) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'SPORT_MISMATCH',
            });
          }

          await tx.tournamentTeam.create({
            data: { tournamentId: input.tournamentId, teamId: input.teamId },
          });
          await tx.tournamentTeamRequest.deleteMany({
            where: {
              tournamentId: input.tournamentId,
              teamId: input.teamId,
            },
          });
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

      return { tournamentId: input.tournamentId };
    }),

  removeTeam: adminProcedure
    .input(
      z.object({ tournamentId: z.string().min(1), teamId: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: input.tournamentId },
          select: { status: true, _count: { select: { matches: true } } },
        });
        if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' });
        if (tournament.status !== 'UPCOMING' || tournament._count.matches > 0) {
          throw new TRPCError({ code: 'CONFLICT' });
        }

        const removed = await tx.tournamentTeam.deleteMany({
          where: { tournamentId: input.tournamentId, teamId: input.teamId },
        });
        if (removed.count === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      });

      return { tournamentId: input.tournamentId };
    }),

  generateFixtures: adminProcedure
    .input(
      z.object({
        tournamentId: z.string().min(1),
        legs: z.union([z.literal(1), z.literal(2)]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.prisma.$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id: input.tournamentId },
          select: {
            status: true,
            teams: { orderBy: { id: 'asc' }, select: { teamId: true } },
            _count: { select: { matches: true } },
          },
        });
        if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' });
        if (tournament.status !== 'UPCOMING' || tournament._count.matches > 0) {
          throw new TRPCError({ code: 'CONFLICT' });
        }
        if (tournament.teams.length < MIN_TEAMS) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NOT_ENOUGH_TEAMS',
          });
        }

        const fixtures = generateRoundRobin(
          tournament.teams.map((entry) => entry.teamId),
          input.legs,
        );
        await tx.match.createMany({
          data: fixtures.map((fixture) => ({
            tournamentId: input.tournamentId,
            round: fixture.round,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
          })),
        });
        return fixtures.length;
      });

      return { count: created };
    }),

  clearFixtures: adminProcedure
    .input(z.object({ tournamentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const completed = await tx.match.count({
          where: { tournamentId: input.tournamentId, status: 'COMPLETED' },
        });
        if (completed > 0) throw new TRPCError({ code: 'CONFLICT' });

        await tx.match.deleteMany({
          where: { tournamentId: input.tournamentId },
        });
      });

      return { tournamentId: input.tournamentId };
    }),

  scheduleMatch: adminProcedure
    .input(
      z.object({
        matchId: z.string().min(1),
        day: dayInput.nullable(),
        time: timeInput.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let scheduledAt: Date | null = null;
      if (input.day && input.time) {
        scheduledAt = athensDateTime(input.day, input.time);
        if (!scheduledAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'DATETIME_INVALID',
          });
        }
      } else if (input.day || input.time) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'DATETIME_INVALID',
        });
      }

      const updated = await ctx.prisma.match.updateMany({
        where: { id: input.matchId },
        data: { scheduledAt },
      });
      if (updated.count === 0) throw new TRPCError({ code: 'NOT_FOUND' });

      return { id: input.matchId };
    }),

  matchRoster: adminProcedure
    .input(z.object({ matchId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.prisma.match.findUnique({
        where: { id: input.matchId },
        select: {
          id: true,
          status: true,
          homeScore: true,
          awayScore: true,
          sets: true,
          tournament: { select: { id: true, name: true, sportType: true } },
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          playerStats: { select: { userId: true, teamId: true, stats: true } },
        },
      });
      if (!match) throw new TRPCError({ code: 'NOT_FOUND' });

      const members = await ctx.prisma.teamMembership.findMany({
        where: { teamId: { in: [match.homeTeam.id, match.awayTeam.id] } },
        orderBy: { joinedAt: 'asc' },
        select: { teamId: true, user: { select: { id: true, name: true } } },
      });

      return {
        id: match.id,
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        sets: match.sets,
        tournament: match.tournament,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        members: members.map((member) => ({
          teamId: member.teamId,
          userId: member.user.id,
          name: member.user.name,
        })),
        playerStats: match.playerStats,
      };
    }),

  recordResult: adminProcedure
    .input(resultInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const match = await tx.match.findUnique({
          where: { id: input.matchId },
          select: {
            id: true,
            status: true,
            tournamentId: true,
            homeTeamId: true,
            awayTeamId: true,
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
            tournament: { select: { name: true, sportType: true } },
            playerStats: { select: { userId: true } },
          },
        });
        if (!match) throw new TRPCError({ code: 'NOT_FOUND' });
        if (!isTournamentSport(match.tournament.sportType)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'SPORT_UNSUPPORTED',
          });
        }

        const checked = checkResult(
          match.tournament.sportType,
          match.homeTeamId,
          match.awayTeamId,
          {
            homeScore: input.homeScore,
            awayScore: input.awayScore,
            sets: input.sets,
            players: input.players,
          },
        );
        if (!checked.ok) throw resultError(checked.code);
        const { result } = checked;

        const previous = new Set(match.playerStats.map((stat) => stat.userId));
        const memberships = await tx.teamMembership.findMany({
          where: {
            OR: [{ teamId: match.homeTeamId }, { teamId: match.awayTeamId }],
          },
          select: { teamId: true, userId: true },
        });
        const memberKeys = new Set(
          memberships.map((member) => `${member.teamId}:${member.userId}`),
        );
        for (const player of result.players) {
          const isMember = memberKeys.has(`${player.teamId}:${player.userId}`);
          if (!isMember && !previous.has(player.userId)) {
            throw resultError('PLAYER_TEAM_INVALID');
          }
        }

        await tx.match.update({
          where: { id: match.id },
          data: {
            homeScore: result.homeScore,
            awayScore: result.awayScore,
            sets: result.sets ?? Prisma.DbNull,
            status: 'COMPLETED',
          },
        });
        await tx.matchPlayerStat.deleteMany({ where: { matchId: match.id } });
        if (result.players.length > 0) {
          await tx.matchPlayerStat.createMany({
            data: result.players.map((player) => ({
              matchId: match.id,
              teamId: player.teamId,
              userId: player.userId,
              stats: player.stats,
            })),
          });
        }

        const pending = await tx.match.count({
          where: { tournamentId: match.tournamentId, status: 'SCHEDULED' },
        });
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: { status: pending === 0 ? 'COMPLETED' : 'ONGOING' },
        });

        if (match.status === 'SCHEDULED') {
          const recipients = Array.from(
            new Set(memberships.map((member) => member.userId)),
          );
          if (recipients.length > 0) {
            await tx.notification.createMany({
              data: recipients.map((userId) => ({
                userId,
                type: 'MATCH_RESULT_SUBMITTED' as const,
                message: matchResultMessage(
                  match.tournament.name,
                  match.homeTeam.name,
                  match.awayTeam.name,
                  result.homeScore,
                  result.awayScore,
                ),
                linkUrl: `/tournaments/${match.tournamentId}`,
              })),
            });
          }
        }
      });

      return { id: input.matchId };
    }),
});
