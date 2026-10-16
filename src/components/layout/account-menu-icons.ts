import {
  Award,
  Calendar,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Trophy,
  User,
  UserRound,
} from 'lucide-react';
import type { AccountMenuLinkKey } from '@/lib/layout/account-menu';

export const accountMenuIcons = {
  messages: MessageCircle,
  bookings: CalendarDays,
  coaching: CalendarClock,
  tournaments: Trophy,
  stats: ClipboardList,
  profile: User,
  coachRequests: Mail,
  coachSlots: Clock,
  coachApplication: Award,
  ownerFields: MapPin,
  ownerBookings: Calendar,
  adminFields: ShieldCheck,
  adminCoaches: UserRound,
  adminTournaments: Trophy,
} as const satisfies Record<AccountMenuLinkKey, unknown>;
