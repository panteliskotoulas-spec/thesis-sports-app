import type { getT } from '@/i18n.server';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export type CoachMenuStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AccountMenuLinkKey =
  | 'messages'
  | 'bookings'
  | 'coaching'
  | 'myTeams'
  | 'myTournaments'
  | 'tournaments'
  | 'stats'
  | 'profile'
  | 'coachRequests'
  | 'coachSlots'
  | 'coachApplication'
  | 'ownerFields'
  | 'ownerBookings'
  | 'adminFields'
  | 'adminCoaches'
  | 'adminTournaments';

export interface AccountMenuLink {
  key: AccountMenuLinkKey;
  href: string;
  label: string;
  mobileOnly?: boolean;
}

export interface AccountMenuGroup {
  key: 'account' | 'coach' | 'owner' | 'admin';
  label?: string;
  links: AccountMenuLink[];
}

export interface BuildAccountMenuInput {
  lng: string;
  t: Translate;
  tc: Translate;
  isAdmin: boolean;
  isBusiness: boolean;
  coachStatus: CoachMenuStatus | null;
}

export function buildAccountMenu({
  lng,
  t,
  tc,
  isAdmin,
  isBusiness,
  coachStatus,
}: BuildAccountMenuInput): AccountMenuGroup[] {
  if (isAdmin) {
    return [
      {
        key: 'admin',
        label: t('nav.groupAdmin'),
        links: [
          {
            key: 'adminFields',
            href: `/${lng}/admin/fields`,
            label: t('nav.adminFields'),
          },
          {
            key: 'adminCoaches',
            href: `/${lng}/admin/coaches`,
            label: t('nav.adminCoaches'),
          },
          {
            key: 'adminTournaments',
            href: `/${lng}/admin/tournaments`,
            label: t('nav.adminTournaments'),
          },
        ],
      },
      {
        key: 'account',
        links: [
          { key: 'profile', href: `/${lng}/profile`, label: t('nav.profile') },
        ],
      },
    ];
  }

  const groups: AccountMenuGroup[] = [
    {
      key: 'account',
      links: [
        {
          key: 'messages',
          href: `/${lng}/messages`,
          label: tc('nav.messages'),
          mobileOnly: true,
        },
        {
          key: 'bookings',
          href: `/${lng}/bookings`,
          label: t('nav.bookings'),
        },
        {
          key: 'coaching',
          href: `/${lng}/coaching`,
          label: t('nav.coaching'),
        },
        {
          key: 'myTeams',
          href: `/${lng}/teams/mine`,
          label: t('nav.myTeams'),
        },
        {
          key: 'myTournaments',
          href: `/${lng}/tournaments/mine`,
          label: t('nav.myTournaments'),
        },
        { key: 'stats', href: `/${lng}/stats`, label: t('nav.stats') },
        { key: 'profile', href: `/${lng}/profile`, label: t('nav.profile') },
      ],
    },
  ];

  if (coachStatus === 'APPROVED') {
    groups.push({
      key: 'coach',
      label: t('nav.groupCoach'),
      links: [
        {
          key: 'coachRequests',
          href: `/${lng}/coaches/requests`,
          label: t('nav.coachRequests'),
        },
        {
          key: 'coachSlots',
          href: `/${lng}/coaches/slots`,
          label: t('nav.coachSlots'),
        },
      ],
    });
  } else if (coachStatus !== null) {
    groups.push({
      key: 'coach',
      label: t('nav.groupCoach'),
      links: [
        {
          key: 'coachApplication',
          href: `/${lng}/coaches/apply`,
          label: t('nav.coachApplication'),
        },
      ],
    });
  }

  if (isBusiness) {
    groups.push({
      key: 'owner',
      label: t('nav.groupOwner'),
      links: [
        {
          key: 'ownerFields',
          href: `/${lng}/owner/fields`,
          label: t('nav.ownerFields'),
        },
        {
          key: 'ownerBookings',
          href: `/${lng}/owner/bookings`,
          label: t('nav.ownerBookings'),
        },
      ],
    });
  }

  return groups;
}
