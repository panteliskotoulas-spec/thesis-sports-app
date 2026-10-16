'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChartColumn,
  Check,
  Crown,
  Ellipsis,
  Settings,
  UserMinus,
  X,
} from 'lucide-react';
import { fillTemplate } from '@/lib/bookings/booking';
import { formatRelativeTime } from '@/lib/notifications/notification';
import {
  deleteTeam,
  removeTeamMember,
  respondToJoinRequest,
  transferLeadership,
} from '@/lib/teams/team-api';
import type {
  JoinRequestItem,
  TeamActionResult,
  TeamRoleValue,
} from '@/lib/teams/team';
import { TeamAvatar } from './TeamAvatar';

export interface TeamManageMember {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: TeamRoleValue;
}

export interface TeamManageLabels {
  requestsTitle: string;
  requestsEmpty: string;
  requestsFull: string;
  accept: string;
  reject: string;
  requestStats: string;
  membersTitle: string;
  leader: string;
  leaderYou: string;
  menuLabel: string;
  transfer: string;
  remove: string;
  confirmTransferTitle: string;
  confirmTransferBody: string;
  confirmTransferAction: string;
  confirmRemoveTitle: string;
  confirmRemoveBody: string;
  confirmRemoveAction: string;
  confirmDeleteTitle: string;
  confirmDeleteBody: string;
  confirmDeleteAction: string;
  confirmBack: string;
  working: string;
  infoTitle: string;
  infoBody: string;
  edit: string;
  leaveTitle: string;
  leaveBody: string;
  deleteAction: string;
  justNow: string;
  errorConflict: string;
  errorGeneric: string;
}

export interface TeamManageProps {
  teamId: string;
  lng: string;
  nowIso: string;
  maxMembers: number;
  currentUserId: string;
  requests: JoinRequestItem[];
  members: TeamManageMember[];
  statsEnabled: boolean;
  labels: TeamManageLabels;
}

type ConfirmKind = 'transfer' | 'remove' | 'delete';

interface PendingConfirm {
  kind: ConfirmKind;
  userId: string;
  name: string;
}

const smallButton =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60';
const card = 'rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5';

export function TeamManage({
  teamId,
  lng,
  nowIso,
  maxMembers,
  currentUserId,
  requests,
  members,
  statsEnabled,
  labels,
}: TeamManageProps) {
  const router = useRouter();
  const [handledRequests, setHandledRequests] = useState<string[]>([]);
  const [removedMembers, setRemovedMembers] = useState<string[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuFor) return;

    function handlePointer(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuFor(null);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuFor(null);
    }

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuFor]);

  const now = new Date(nowIso);
  const visibleRequests = requests.filter(
    (request) => !handledRequests.includes(request.id),
  );
  const visibleMembers = members.filter(
    (member) => !removedMembers.includes(member.userId),
  );
  const full = visibleMembers.length >= maxMembers;
  const sole = visibleMembers.length === 1;

  async function run(
    key: string,
    action: () => Promise<TeamActionResult>,
    onDone: () => void,
    refresh = true,
  ) {
    if (busyKey) return;

    setBusyKey(key);
    setError(null);

    let result: TeamActionResult;
    try {
      result = await action();
    } catch {
      result = { status: 'error' };
    }

    setBusyKey(null);

    if (result.status === 'ok') {
      onDone();
      if (refresh) router.refresh();
      return;
    }

    setError(
      result.status === 'conflict' ? labels.errorConflict : labels.errorGeneric,
    );
  }

  function handleRespond(id: string, decision: 'ACCEPT' | 'REJECT') {
    run(
      `${decision}-${id}`,
      () => respondToJoinRequest(id, decision),
      () => setHandledRequests((previous) => [...previous, id]),
    );
  }

  function handleConfirm() {
    if (!confirm) return;
    const { kind, userId } = confirm;

    if (kind === 'transfer') {
      run(
        'confirm',
        () => transferLeadership(teamId, userId),
        () => setConfirm(null),
      );
    } else if (kind === 'remove') {
      run(
        'confirm',
        () => removeTeamMember(teamId, userId),
        () => {
          setRemovedMembers((previous) => [...previous, userId]);
          setConfirm(null);
        },
      );
    } else {
      run(
        'confirm',
        () => deleteTeam(teamId),
        () => router.push(`/${lng}/teams`),
        false,
      );
    }
  }

  const confirmCopy: Record<
    ConfirmKind,
    { title: string; body: string; action: string }
  > = {
    transfer: {
      title: labels.confirmTransferTitle,
      body: labels.confirmTransferBody,
      action: labels.confirmTransferAction,
    },
    remove: {
      title: labels.confirmRemoveTitle,
      body: labels.confirmRemoveBody,
      action: labels.confirmRemoveAction,
    },
    delete: {
      title: labels.confirmDeleteTitle,
      body: labels.confirmDeleteBody,
      action: labels.confirmDeleteAction,
    },
  };

  function renderConfirm() {
    if (!confirm) return null;
    const copy = confirmCopy[confirm.kind];
    const values = { name: confirm.name };

    return (
      <div className="mt-4 rounded-xl bg-secondary p-3">
        <p className="font-medium text-foreground">
          {fillTemplate(copy.title, values)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {fillTemplate(copy.body, values)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busyKey !== null}
            onClick={() => setConfirm(null)}
            className={`${smallButton} h-11 border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`}
          >
            {labels.confirmBack}
          </button>
          <button
            type="button"
            disabled={busyKey !== null}
            onClick={handleConfirm}
            className={`${smallButton} h-11 ${
              confirm.kind === 'transfer'
                ? 'bg-primary text-primary-foreground'
                : 'bg-destructive text-destructive-foreground'
            } hover:opacity-90`}
          >
            {busyKey === 'confirm' ? labels.working : copy.action}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg">{labels.requestsTitle}</h2>
          {visibleRequests.length > 0 ? (
            <span className="rounded-full bg-terracotta/15 px-2.5 py-0.5 text-xs font-medium text-terracotta">
              {visibleRequests.length}
            </span>
          ) : null}
        </div>

        {full && visibleRequests.length > 0 ? (
          <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">
            {labels.requestsFull}
          </p>
        ) : null}

        {visibleRequests.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{labels.requestsEmpty}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {visibleRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-3"
              >
                <TeamAvatar
                  name={request.name}
                  logoUrl={request.avatarUrl}
                  size="sm"
                />
                <div className="min-w-32 flex-1">
                  <p className="truncate font-medium">{request.name}</p>
                  <p
                    suppressHydrationWarning
                    className="text-sm text-muted-foreground"
                  >
                    {formatRelativeTime(
                      request.createdAt,
                      now,
                      lng,
                      labels.justNow,
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statsEnabled ? (
                    <Link
                      href={`/${lng}/teams/${teamId}/manage/requests/${request.id}`}
                      className={`${smallButton} border-[0.5px] border-primary text-primary hover:bg-secondary`}
                    >
                      <ChartColumn className="size-4" aria-hidden="true" />
                      {labels.requestStats}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    disabled={full || busyKey !== null}
                    onClick={() => handleRespond(request.id, 'ACCEPT')}
                    className={`${smallButton} bg-primary text-primary-foreground hover:opacity-90`}
                  >
                    <Check className="size-4" aria-hidden="true" />
                    {labels.accept}
                  </button>
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    onClick={() => handleRespond(request.id, 'REJECT')}
                    className={`${smallButton} border-[0.5px] border-border bg-card text-foreground hover:bg-secondary`}
                  >
                    <X className="size-4" aria-hidden="true" />
                    {labels.reject}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="text-lg">
          {fillTemplate(labels.membersTitle, {
            current: String(visibleMembers.length),
            max: String(maxMembers),
          })}
        </h2>

        <ul className="mt-4 flex flex-col gap-3">
          {visibleMembers.map((member) => {
            const isSelf = member.userId === currentUserId;
            const menuOpen = menuFor === member.userId;

            return (
              <li key={member.userId} className="flex items-center gap-3">
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
                    {isSelf ? labels.leaderYou : labels.leader}
                  </span>
                ) : (
                  <div
                    ref={menuOpen ? menuRef : undefined}
                    className="relative shrink-0"
                  >
                    <button
                      type="button"
                      aria-label={fillTemplate(labels.menuLabel, {
                        name: member.name,
                      })}
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                      onClick={() =>
                        setMenuFor(menuOpen ? null : member.userId)
                      }
                      className="inline-flex size-10 items-center justify-center rounded-full border-[0.5px] border-border bg-card text-foreground hover:bg-secondary"
                    >
                      <Ellipsis className="size-4" aria-hidden="true" />
                    </button>

                    {menuOpen ? (
                      <div
                        role="menu"
                        className="absolute top-full right-0 z-10 mt-1 w-60 rounded-xl border-[0.5px] border-border bg-card p-1"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuFor(null);
                            setError(null);
                            setConfirm({
                              kind: 'transfer',
                              userId: member.userId,
                              name: member.name,
                            });
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary"
                        >
                          <Crown className="size-4" aria-hidden="true" />
                          {labels.transfer}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuFor(null);
                            setError(null);
                            setConfirm({
                              kind: 'remove',
                              userId: member.userId,
                              name: member.name,
                            });
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-destructive hover:bg-secondary"
                        >
                          <UserMinus className="size-4" aria-hidden="true" />
                          {labels.remove}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {confirm && confirm.kind !== 'delete' ? renderConfirm() : null}
      </section>

      <section className={card}>
        <h2 className="text-lg">{labels.infoTitle}</h2>
        <p className="mt-2 text-muted-foreground">{labels.infoBody}</p>
        <Link
          href={`/${lng}/teams/${teamId}/edit`}
          className={`${smallButton} mt-3 w-full border-[0.5px] border-border bg-card text-foreground hover:bg-secondary sm:w-auto`}
        >
          <Settings className="size-4" aria-hidden="true" />
          {labels.edit}
        </Link>

        <div className="mt-4 border-t-[0.5px] border-border pt-4">
          <p className="font-medium text-foreground">{labels.leaveTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.leaveBody}
          </p>

          {sole ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setConfirm({
                  kind: 'delete',
                  userId: currentUserId,
                  name: '',
                });
              }}
              className={`${smallButton} mt-3 w-full border-[0.5px] border-border bg-card text-destructive hover:bg-secondary sm:w-auto`}
            >
              {labels.deleteAction}
            </button>
          ) : null}

          {confirm && confirm.kind === 'delete' ? renderConfirm() : null}
        </div>
      </section>
    </div>
  );
}
