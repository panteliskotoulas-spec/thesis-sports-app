import 'server-only';

import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type {
  CreditHistoryInput,
  CreditHistoryResult,
} from '@/lib/profile/profile';

type Db = PrismaClient | Prisma.TransactionClient;

export async function listCreditHistory(
  db: Db,
  userId: string,
  input: CreditHistoryInput,
): Promise<Extract<CreditHistoryResult, { status: 'ok' }>> {
  const [user, rows] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    }),
    db.creditTransaction.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: input.offset,
      take: input.limit + 1,
    }),
  ]);

  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    status: 'ok',
    balance: user ? user.creditBalance.toNumber() : 0,
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount.toNumber(),
      createdAt: row.createdAt.toISOString(),
    })),
    hasMore,
  };
}
