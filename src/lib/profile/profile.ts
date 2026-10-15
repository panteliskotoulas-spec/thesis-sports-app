export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 100;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const CREDIT_PAGE_SIZE = 20;

export const PROFILE_TABS = [
  'details',
  'credit',
  'security',
  'delete',
] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];
export const DEFAULT_PROFILE_TAB: ProfileTab = 'details';

export function parseProfileTab(
  value: string | string[] | undefined,
): ProfileTab {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PROFILE_TABS.find((tab) => tab === candidate) ?? DEFAULT_PROFILE_TAB;
}

export function userInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export type AccountTypeValue = 'INDIVIDUAL' | 'BUSINESS';

export interface ProfileUser {
  name: string;
  email: string;
  avatarUrl: string | null;
  accountType: AccountTypeValue;
  businessName: string | null;
  taxId: string | null;
}

export type CreditTxTypeValue =
  | 'EARNED_FROM_CANCELLATION'
  | 'SPENT_ON_BOOKING'
  | 'EARNED_FROM_SPLIT'
  | 'SPENT_ON_SPLIT';

export interface CreditTransactionItem {
  id: string;
  type: CreditTxTypeValue;
  amount: number;
  createdAt: string;
}

export interface CreditHistoryInput {
  offset: number;
  limit: number;
}

export type CreditHistoryResult =
  | {
      status: 'ok';
      balance: number;
      items: CreditTransactionItem[];
      hasMore: boolean;
    }
  | { status: 'error' };

export type ProfileActionResult = { status: 'ok' } | { status: 'error' };

export type UploadAvatarResult =
  | { status: 'ok'; url: string }
  | { status: 'error' };

export type ChangePasswordResult =
  | { status: 'ok' }
  | { status: 'wrongPassword' }
  | { status: 'error' };

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
}

export type DeletionBlockerKind =
  | 'UPCOMING_BOOKINGS'
  | 'UPCOMING_SESSIONS'
  | 'TEAM_LEADER'
  | 'OWNED_FIELD_BOOKINGS'
  | 'COACH_SESSIONS'
  | 'PENDING_SPLITS';

export interface DeletionBlocker {
  kind: DeletionBlockerKind;
  count: number;
}

export type DeletionStatusResult =
  | { status: 'ok'; blockers: DeletionBlocker[]; creditBalance: number }
  | { status: 'error' };

export interface DeleteAccountInput {
  password: string;
  acceptCreditLoss: boolean;
}

export type DeleteAccountResult =
  | { status: 'ok' }
  | { status: 'wrongPassword' }
  | { status: 'blocked' }
  | { status: 'unauthorized' }
  | { status: 'error' };
