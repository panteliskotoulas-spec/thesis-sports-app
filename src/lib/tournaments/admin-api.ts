import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import { isServerMessageCode, parseMaxTeams } from './admin';
import type { TournamentFormValues } from './admin';
import type { CheckedResult } from './result';
import type { TournamentSport } from './tournament';

export type AdminActionResult =
  | { ok: true; id: string | null }
  | { ok: false; code: string };

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
    }),
  ],
});

function toLanguage(lng: string): 'el' | 'en' {
  return lng === 'en' ? 'en' : 'el';
}

function toFailure(error: unknown): AdminActionResult {
  if (error instanceof TRPCClientError) {
    const code = (error.data as { code?: string } | null | undefined)?.code;
    if (code === 'BAD_REQUEST' && isServerMessageCode(error.message)) {
      return { ok: false, code: error.message };
    }
    if (code === 'CONFLICT') return { ok: false, code: 'CONFLICT' };
    if (code === 'NOT_FOUND') return { ok: false, code: 'NOT_FOUND' };
  }
  return { ok: false, code: 'ERROR' };
}

interface MutationResult {
  id?: string;
  tournamentId?: string;
  count?: number;
}

async function run(
  action: () => Promise<MutationResult | null>,
): Promise<AdminActionResult> {
  try {
    const result = await action();
    return { ok: true, id: result?.id ?? result?.tournamentId ?? null };
  } catch (error) {
    return toFailure(error);
  }
}

function fieldsOf(values: TournamentFormValues, lng: string) {
  return {
    lng: toLanguage(lng),
    name: values.name.trim(),
    hostFieldId: values.hostFieldId,
    startDay: values.startDay,
    endDay: values.endDay,
    maxTeams: parseMaxTeams(values.maxTeams) ?? 0,
    description: values.description.trim(),
  };
}

export function createTournament(
  values: TournamentFormValues,
  sport: TournamentSport,
  lng: string,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournaments.create.mutate({ ...fieldsOf(values, lng), sport }),
  );
}

export function updateTournament(
  id: string,
  values: TournamentFormValues,
  lng: string,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournaments.update.mutate({ id, ...fieldsOf(values, lng) }),
  );
}

export function removeTournament(id: string): Promise<AdminActionResult> {
  return run(() => client.tournaments.remove.mutate({ id }));
}

export function addTournamentTeam(
  tournamentId: string,
  teamId: string,
): Promise<AdminActionResult> {
  return run(() => client.tournaments.addTeam.mutate({ tournamentId, teamId }));
}

export function removeTournamentTeam(
  tournamentId: string,
  teamId: string,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournaments.removeTeam.mutate({ tournamentId, teamId }),
  );
}

export function generateTournamentFixtures(
  tournamentId: string,
  legs: 1 | 2,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournaments.generateFixtures.mutate({ tournamentId, legs }),
  );
}

export function clearTournamentFixtures(
  tournamentId: string,
): Promise<AdminActionResult> {
  return run(() => client.tournaments.clearFixtures.mutate({ tournamentId }));
}

export function recordMatchResult(
  matchId: string,
  result: CheckedResult,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournaments.recordResult.mutate({
      matchId,
      homeScore: result.sets ? null : result.homeScore,
      awayScore: result.sets ? null : result.awayScore,
      sets: result.sets,
      players: result.players,
    }),
  );
}

export function scheduleTournamentMatch(
  matchId: string,
  day: string,
  time: string,
): Promise<AdminActionResult> {
  return run(() =>
    client.tournaments.scheduleMatch.mutate({
      matchId,
      day: day || null,
      time: time || null,
    }),
  );
}
