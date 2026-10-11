export type NotificationType =
  | 'JOIN_REQUEST_RECEIVED'
  | 'JOIN_REQUEST_ACCEPTED'
  | 'JOIN_REQUEST_REJECTED'
  | 'FIELD_LISTING_APPROVED'
  | 'FIELD_LISTING_REJECTED'
  | 'COACH_PROFILE_APPROVED'
  | 'COACH_PROFILE_REJECTED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_CANCELLED'
  | 'PAYMENT_SPLIT_REQUESTED'
  | 'COACHING_SESSION_REQUESTED'
  | 'COACHING_SESSION_ACCEPTED'
  | 'COACHING_SESSION_REJECTED'
  | 'LEADERSHIP_TRANSFERRED'
  | 'TEAM_RESERVATION_CREATED'
  | 'TEAM_RESERVATION_CANCELLED'
  | 'TEAM_SPLIT_PAID'
  | 'MATCH_RESULT_SUBMITTED'
  | 'REVIEW_RECEIVED'
  | 'PAYOUT_RECEIVED'
  | 'NEW_MESSAGE';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

export type NotificationIconKey =
  | 'check'
  | 'calendarX'
  | 'alert'
  | 'wallet'
  | 'star'
  | 'user'
  | 'bell';

export type NotificationTone = 'default' | 'negative';

export interface NotificationAppearance {
  icon: NotificationIconKey;
  tone: NotificationTone;
}

export const NOTIFICATIONS_PAGE_SIZE = 20;
export const NOTIFICATIONS_PANEL_SIZE = 6;

const appearances: Record<NotificationType, NotificationAppearance> = {
  JOIN_REQUEST_RECEIVED: { icon: 'user', tone: 'default' },
  JOIN_REQUEST_ACCEPTED: { icon: 'check', tone: 'default' },
  JOIN_REQUEST_REJECTED: { icon: 'alert', tone: 'negative' },
  FIELD_LISTING_APPROVED: { icon: 'check', tone: 'default' },
  FIELD_LISTING_REJECTED: { icon: 'alert', tone: 'negative' },
  COACH_PROFILE_APPROVED: { icon: 'check', tone: 'default' },
  COACH_PROFILE_REJECTED: { icon: 'alert', tone: 'negative' },
  RESERVATION_CONFIRMED: { icon: 'check', tone: 'default' },
  RESERVATION_CANCELLED: { icon: 'calendarX', tone: 'default' },
  PAYMENT_SPLIT_REQUESTED: { icon: 'wallet', tone: 'default' },
  COACHING_SESSION_REQUESTED: { icon: 'user', tone: 'default' },
  COACHING_SESSION_ACCEPTED: { icon: 'check', tone: 'default' },
  COACHING_SESSION_REJECTED: { icon: 'alert', tone: 'negative' },
  LEADERSHIP_TRANSFERRED: { icon: 'user', tone: 'default' },
  TEAM_RESERVATION_CREATED: { icon: 'check', tone: 'default' },
  TEAM_RESERVATION_CANCELLED: { icon: 'calendarX', tone: 'default' },
  TEAM_SPLIT_PAID: { icon: 'wallet', tone: 'default' },
  MATCH_RESULT_SUBMITTED: { icon: 'bell', tone: 'default' },
  REVIEW_RECEIVED: { icon: 'star', tone: 'default' },
  PAYOUT_RECEIVED: { icon: 'wallet', tone: 'default' },
  NEW_MESSAGE: { icon: 'bell', tone: 'default' },
};

export function getNotificationAppearance(
  type: NotificationType,
): NotificationAppearance {
  return appearances[type] ?? { icon: 'bell', tone: 'default' };
}

export function toNotificationHref(
  linkUrl: string | null,
  lng: string,
): string | null {
  if (!linkUrl || !linkUrl.startsWith('/') || linkUrl.startsWith('//')) {
    return null;
  }
  return `/${lng}${linkUrl}`;
}

export function formatBadgeCount(count: number): string {
  return count > 9 ? '9+' : String(count);
}

export function formatRelativeTime(
  value: string,
  now: Date,
  lng: string,
  justNow: string,
): string {
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const distance = Math.abs(seconds);

  if (distance < 60) return justNow;

  const formatter = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });

  if (distance < 3600) {
    return formatter.format(Math.round(seconds / 60), 'minute');
  }
  if (distance < 86400) {
    return formatter.format(Math.round(seconds / 3600), 'hour');
  }
  if (distance < 7 * 86400) {
    return formatter.format(Math.round(seconds / 86400), 'day');
  }

  return new Intl.DateTimeFormat(lng, {
    timeZone: 'Europe/Athens',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
