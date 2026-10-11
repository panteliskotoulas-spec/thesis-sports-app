import { Crown } from 'lucide-react';
import type { TeamMemberRow } from '@/lib/teams/team';
import { TeamAvatar } from './TeamAvatar';

export interface TeamMembersListProps {
  members: Pick<
    TeamMemberRow,
    'membershipId' | 'name' | 'avatarUrl' | 'role'
  >[];
  title: string;
  leaderLabel: string;
}

export function TeamMembersList({
  members,
  title,
  leaderLabel,
}: TeamMembersListProps) {
  return (
    <section className="rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5">
      <h2 className="text-lg">{title}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {members.map((member) => (
          <li key={member.membershipId} className="flex items-center gap-3">
            <TeamAvatar
              name={member.name}
              logoUrl={member.avatarUrl}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {member.name}
            </span>
            {member.role === 'LEADER' ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                <Crown className="size-3.5" aria-hidden="true" />
                {leaderLabel}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
