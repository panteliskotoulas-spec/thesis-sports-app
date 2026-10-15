import 'server-only';

import { TRPCError } from '@trpc/server';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type {
  ChatConversation,
  ChatKind,
  ChatLastMessage,
  ChatMessage,
  ChatThreadData,
  FetchThreadInput,
} from '@/lib/chat/chat';
import { formatTimeRange } from '@/lib/fields/detail-format';
import { shortReviewerName } from '@/lib/reviews/review';
import { newChatMessageMessage } from '@/lib/server/chat-notifications';

type Db = PrismaClient | Prisma.TransactionClient;
type Lng = 'el' | 'en';

const RATE_WINDOW_MS = 10_000;
const RATE_MAX_MESSAGES = 8;
const OPEN_SESSION_STATUSES = ['ACCEPTED', 'CONFIRMED'];

interface ConversationRow {
  id: string;
  type: string;
  teamId: string | null;
  coachingSessionId: string | null;
  createdAt: Date;
}

interface Access {
  kind: ChatKind;
  title: string;
  subtitle: string | null;
  logoUrl: string | null;
  memberCount: number | null;
  readOnly: boolean;
  recipientIds: string[];
  teamName: string | null;
}

const conversationSelect = {
  id: true,
  type: true,
  teamId: true,
  coachingSessionId: true,
  createdAt: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function describeSlot(start: Date, end: Date, lng: Lng): string {
  const day = new Intl.DateTimeFormat(lng, {
    timeZone: 'Europe/Athens',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(start);

  return `${day}, ${formatTimeRange(start, end, lng)}`;
}

async function resolveAccess(
  db: Db,
  row: ConversationRow,
  userId: string,
  lng: Lng,
): Promise<Access | null> {
  if (row.type === 'TEAM' && row.teamId) {
    const team = await db.team.findUnique({
      where: { id: row.teamId },
      select: {
        name: true,
        logoUrl: true,
        members: { select: { userId: true } },
      },
    });
    if (!team) return null;

    const memberIds = team.members.map((member) => member.userId);
    if (!memberIds.includes(userId)) return null;

    return {
      kind: 'TEAM',
      title: team.name,
      subtitle: null,
      logoUrl: team.logoUrl,
      memberCount: memberIds.length,
      readOnly: false,
      recipientIds: memberIds.filter((id) => id !== userId),
      teamName: team.name,
    };
  }

  if (row.type === 'COACH' && row.coachingSessionId) {
    const session = await db.coachingSession.findUnique({
      where: { id: row.coachingSessionId },
      select: {
        status: true,
        userId: true,
        user: { select: { name: true } },
        slot: {
          select: {
            startTime: true,
            endTime: true,
            coach: {
              select: { userId: true, user: { select: { name: true } } },
            },
          },
        },
      },
    });
    if (!session) return null;

    const clientId = session.userId;
    const coachUserId = session.slot.coach.userId;
    if (userId !== clientId && userId !== coachUserId) return null;

    const isClient = userId === clientId;
    const counterpartId = isClient ? coachUserId : clientId;
    const counterpartName = isClient
      ? session.slot.coach.user.name
      : session.user.name;

    return {
      kind: 'COACH',
      title: counterpartName,
      subtitle: describeSlot(session.slot.startTime, session.slot.endTime, lng),
      logoUrl: null,
      memberCount: null,
      readOnly: !OPEN_SESSION_STATUSES.includes(session.status),
      recipientIds: [counterpartId],
      teamName: null,
    };
  }

  return null;
}

async function loadAccess(
  db: Db,
  conversationId: string,
  userId: string,
  lng: Lng,
): Promise<{ row: ConversationRow; access: Access }> {
  const row = await db.conversation.findUnique({
    where: { id: conversationId },
    select: conversationSelect,
  });
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

  const access = await resolveAccess(db, row, userId, lng);
  if (!access) throw new TRPCError({ code: 'NOT_FOUND' });

  return { row, access };
}

async function loadSenderNames(
  db: Db,
  senderIds: string[],
): Promise<Map<string, string>> {
  const ids = [...new Set(senderIds)];
  if (ids.length === 0) return new Map();

  const users = await db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });

  return new Map(users.map((user) => [user.id, shortReviewerName(user.name)]));
}

interface MessageRecord {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

function toChatMessage(
  record: MessageRecord,
  userId: string,
  names: Map<string, string>,
): ChatMessage {
  return {
    id: record.id,
    senderId: record.senderId,
    senderName: names.get(record.senderId) ?? '',
    isMine: record.senderId === userId,
    content: record.content,
    createdAt: record.createdAt.toISOString(),
  };
}

async function countUnread(
  db: Db,
  conversationId: string,
  userId: string,
): Promise<number> {
  const read = await db.conversationRead.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { lastReadAt: true },
  });

  return db.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      ...(read ? { createdAt: { gt: read.lastReadAt } } : {}),
    },
  });
}

async function loadLastMessage(
  db: Db,
  conversationId: string,
  userId: string,
): Promise<{ last: ChatLastMessage | null; createdAt: Date | null }> {
  const record = await db.message.findFirst({
    where: { conversationId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true, senderId: true, content: true, createdAt: true },
  });
  if (!record) return { last: null, createdAt: null };

  const names = await loadSenderNames(db, [record.senderId]);

  return {
    last: {
      content: record.content,
      senderName: names.get(record.senderId) ?? '',
      isMine: record.senderId === userId,
      createdAt: record.createdAt.toISOString(),
    },
    createdAt: record.createdAt,
  };
}

function toConversation(
  id: string,
  access: Access,
  unreadCount: number,
  lastMessage: ChatLastMessage | null,
): ChatConversation {
  return {
    id,
    kind: access.kind,
    title: access.title,
    subtitle: access.subtitle,
    logoUrl: access.logoUrl,
    memberCount: access.memberCount,
    readOnly: access.readOnly,
    unreadCount,
    lastMessage,
  };
}

async function loadCandidateRows(
  db: Db,
  userId: string,
): Promise<ConversationRow[]> {
  const [memberships, sessions] = await Promise.all([
    db.teamMembership.findMany({
      where: { userId },
      select: { teamId: true },
    }),
    db.coachingSession.findMany({
      where: { OR: [{ userId }, { slot: { coach: { userId } } }] },
      select: { id: true },
    }),
  ]);

  return db.conversation.findMany({
    where: {
      OR: [
        {
          type: 'TEAM',
          teamId: { in: memberships.map((membership) => membership.teamId) },
        },
        {
          type: 'COACH',
          coachingSessionId: { in: sessions.map((session) => session.id) },
        },
      ],
    },
    select: conversationSelect,
  });
}

export async function countUnreadMessages(
  db: Db,
  userId: string,
): Promise<number> {
  const rows = await loadCandidateRows(db, userId);
  const counts = await Promise.all(
    rows.map((row) => countUnread(db, row.id, userId)),
  );

  return counts.reduce((sum, value) => sum + value, 0);
}

export async function listConversations(
  db: Db,
  userId: string,
  lng: Lng,
): Promise<ChatConversation[]> {
  const rows = await loadCandidateRows(db, userId);

  const built = await Promise.all(
    rows.map(async (row) => {
      const access = await resolveAccess(db, row, userId, lng);
      if (!access) return null;

      const [unread, last] = await Promise.all([
        countUnread(db, row.id, userId),
        loadLastMessage(db, row.id, userId),
      ]);

      return {
        sortAt: (last.createdAt ?? row.createdAt).getTime(),
        conversation: toConversation(row.id, access, unread, last.last),
      };
    }),
  );

  return built
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.sortAt - a.sortAt)
    .map((entry) => entry.conversation);
}

export async function getThread(
  db: Db,
  userId: string,
  input: FetchThreadInput,
): Promise<ChatThreadData> {
  const { row, access } = await loadAccess(
    db,
    input.conversationId,
    userId,
    input.lng,
  );

  let records: MessageRecord[] = [];
  let hasMore = false;

  if (input.after) {
    const cursor = await db.message.findFirst({
      where: { id: input.after, conversationId: row.id },
      select: { id: true, createdAt: true },
    });

    if (cursor) {
      records = await db.message.findMany({
        where: {
          conversationId: row.id,
          OR: [
            { createdAt: { gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { gt: cursor.id } },
          ],
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: input.limit,
        select: { id: true, senderId: true, content: true, createdAt: true },
      });
    }
  } else {
    let where: Prisma.MessageWhereInput = { conversationId: row.id };
    let proceed = true;

    if (input.before) {
      const cursor = await db.message.findFirst({
        where: { id: input.before, conversationId: row.id },
        select: { id: true, createdAt: true },
      });

      if (cursor) {
        where = {
          conversationId: row.id,
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } },
          ],
        };
      } else {
        proceed = false;
      }
    }

    if (proceed) {
      const found = await db.message.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: input.limit + 1,
        select: { id: true, senderId: true, content: true, createdAt: true },
      });

      hasMore = found.length > input.limit;
      records = (hasMore ? found.slice(0, input.limit) : found).reverse();
    }
  }

  const [names, unread, last] = await Promise.all([
    loadSenderNames(
      db,
      records.map((record) => record.senderId),
    ),
    countUnread(db, row.id, userId),
    loadLastMessage(db, row.id, userId),
  ]);

  return {
    conversation: toConversation(row.id, access, unread, last.last),
    messages: records.map((record) => toChatMessage(record, userId, names)),
    hasMore,
  };
}

export async function sendMessage(
  db: Db,
  user: { id: string; name: string },
  conversationId: string,
  content: string,
): Promise<ChatMessage> {
  const { row, access } = await loadAccess(db, conversationId, user.id, 'el');

  if (access.readOnly) throw new TRPCError({ code: 'CONFLICT' });

  const recent = await db.message.count({
    where: {
      conversationId: row.id,
      senderId: user.id,
      createdAt: { gt: new Date(Date.now() - RATE_WINDOW_MS) },
    },
  });
  if (recent >= RATE_MAX_MESSAGES) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
  }

  const created = await db.message.create({
    data: { conversationId: row.id, senderId: user.id, content },
    select: { id: true, senderId: true, content: true, createdAt: true },
  });

  await db.conversationRead.upsert({
    where: {
      conversationId_userId: { conversationId: row.id, userId: user.id },
    },
    create: {
      conversationId: row.id,
      userId: user.id,
      lastReadAt: created.createdAt,
    },
    update: { lastReadAt: created.createdAt },
  });

  try {
    await notifyRecipients(db, row.id, access, user.name);
  } catch (error) {
    console.error('[chat notify]', error);
  }

  return toChatMessage(
    created,
    user.id,
    new Map([[user.id, shortReviewerName(user.name)]]),
  );
}

async function notifyRecipients(
  db: Db,
  conversationId: string,
  access: Access,
  senderName: string,
): Promise<void> {
  const linkUrl = `/messages/${conversationId}`;

  for (const recipientId of access.recipientIds) {
    const existing = await db.notification.findFirst({
      where: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        isRead: false,
        linkUrl,
      },
      select: { id: true },
    });
    if (existing) continue;

    await db.notification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        message: newChatMessageMessage(senderName, access.teamName),
        linkUrl,
      },
    });
  }
}

export async function markConversationRead(
  db: Db,
  userId: string,
  conversationId: string,
): Promise<void> {
  const { row } = await loadAccess(db, conversationId, userId, 'el');
  const now = new Date();

  await db.conversationRead.upsert({
    where: { conversationId_userId: { conversationId: row.id, userId } },
    create: { conversationId: row.id, userId, lastReadAt: now },
    update: { lastReadAt: now },
  });

  await db.notification.updateMany({
    where: {
      userId,
      type: 'NEW_MESSAGE',
      isRead: false,
      linkUrl: `/messages/${row.id}`,
    },
    data: { isRead: true },
  });
}

async function findOrCreateTeamConversation(
  db: Db,
  teamId: string,
): Promise<string> {
  const existing = await db.conversation.findUnique({
    where: { teamId },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const created = await db.conversation.create({
      data: { type: 'TEAM', teamId },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const again = await db.conversation.findUnique({
      where: { teamId },
      select: { id: true },
    });
    if (!again) throw error;
    return again.id;
  }
}

async function findOrCreateCoachConversation(
  db: Db,
  coachingSessionId: string,
): Promise<string> {
  const existing = await db.conversation.findUnique({
    where: { coachingSessionId },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const created = await db.conversation.create({
      data: { type: 'COACH', coachingSessionId },
      select: { id: true },
    });
    return created.id;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const again = await db.conversation.findUnique({
      where: { coachingSessionId },
      select: { id: true },
    });
    if (!again) throw error;
    return again.id;
  }
}

export async function openConversation(
  db: Db,
  userId: string,
  kind: 'team' | 'coach',
  id: string,
): Promise<{ conversationId: string }> {
  if (kind === 'team') {
    const membership = await db.teamMembership.findUnique({
      where: { teamId_userId: { teamId: id, userId } },
      select: { id: true },
    });
    if (!membership) throw new TRPCError({ code: 'NOT_FOUND' });

    return { conversationId: await findOrCreateTeamConversation(db, id) };
  }

  const session = await db.coachingSession.findUnique({
    where: { id },
    select: {
      status: true,
      userId: true,
      slot: { select: { coach: { select: { userId: true } } } },
    },
  });
  if (
    !session ||
    !OPEN_SESSION_STATUSES.includes(session.status) ||
    (session.userId !== userId && session.slot.coach.userId !== userId)
  ) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return { conversationId: await findOrCreateCoachConversation(db, id) };
}
