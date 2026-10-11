import { getT } from '@/i18n.server';
import { lng as routeLanguage } from 'next/root-params';
import {
  hasActiveTeamFilters,
  type TeamFilters,
} from '@/lib/teams/team-filters';
import { getMockTeams } from '@/lib/teams/team-mock';
import { toTeamListItem, type TeamListItem } from '@/lib/teams/team';
import { TeamCard } from './TeamCard';
import { TeamsEmpty } from './TeamsEmpty';
import { TeamsError } from './TeamsError';
import { TeamsGrid } from './TeamsGrid';

export async function TeamsList({ filters }: { filters: TeamFilters }) {
  const { t } = await getT('teams');
  const lng = await routeLanguage();

  let teams: TeamListItem[];
  try {
    teams = getMockTeams(filters).map((row) => toTeamListItem(row, lng));
  } catch (error) {
    console.error('[TeamsList]', error);
    return <TeamsError />;
  }

  if (teams.length === 0) {
    return <TeamsEmpty hasFilters={hasActiveTeamFilters(filters)} />;
  }

  return (
    <section>
      <p className="mb-3 text-muted-foreground" aria-live="polite">
        {t('page.count', { count: teams.length })}
      </p>
      <TeamsGrid>
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </TeamsGrid>
    </section>
  );
}
