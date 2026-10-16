'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Menu, UserRound, Users } from 'lucide-react';
import { useChatUnread } from '@/components/chat/useChatUnread';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { fillTemplate } from '@/lib/bookings/booking';
import type { AccountMenuGroup } from '@/lib/layout/account-menu';
import { formatBadgeCount } from '@/lib/notifications/notification';
import { accountMenuIcons } from './account-menu-icons';

// Οι Server Components δεν μπορούν να περάσουν components ως props,
// γι' αυτό περνάμε ένα κλειδί και το εικονίδιο επιλέγεται εδώ.
const icons = {
  home: Home,
  fields: MapPin,
  teams: Users,
  coaches: UserRound,
} as const;

export interface BottomNavItem {
  icon: keyof typeof icons;
  href: string;
  label: string;
  exact?: boolean;
}

export interface BottomNavMenu {
  label: string;
  title: string;
  closeLabel: string;
  unreadLabel: string;
  signOutLabel: string;
  lng: string;
  groups: AccountMenuGroup[];
}

export interface BottomNavLinksProps {
  label: string;
  items: BottomNavItem[];
  menu: BottomNavMenu;
  messagesUnread: number;
}

function Badge({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-medium leading-none text-white"
    >
      {formatBadgeCount(count)}
    </span>
  );
}

export function BottomNavLinks({
  label,
  items,
  menu,
  messagesUnread,
}: BottomNavLinksProps) {
  const pathname = usePathname();
  const unread = useChatUnread(messagesUnread);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPathActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const menuActive = menu.groups.some((group) =>
    group.links.some((link) => isPathActive(link.href)),
  );

  const tabClass = (isActive: boolean) =>
    `flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs ${
      isActive ? 'text-foreground' : 'text-muted-foreground'
    }`;

  const pillClass = (isActive: boolean) =>
    `relative flex h-7 w-14 items-center justify-center rounded-full ${
      isActive ? 'bg-secondary' : ''
    }`;

  return (
    <>
      {/* Κενό στο τέλος της σελίδας, ώστε το fixed nav να μη σκεπάζει περιεχόμενο */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      <nav
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-border bg-background md:hidden"
      >
        <ul className="mx-auto flex h-16 max-w-xl items-stretch justify-around px-2">
          {items.map((item) => {
            const Icon = icons[item.icon];
            const isActive = isPathActive(item.href, item.exact);

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={tabClass(isActive)}
                >
                  <span className={pillClass(isActive)}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <li className="flex-1">
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label={
                    unread > 0
                      ? `${menu.label}, ${fillTemplate(menu.unreadLabel, {
                          count: String(unread),
                        })}`
                      : undefined
                  }
                  className={tabClass(menuActive)}
                >
                  <span className={pillClass(menuActive)}>
                    <Menu className="size-5" aria-hidden="true" />
                    {unread > 0 ? <Badge count={unread} /> : null}
                  </span>
                  {menu.label}
                </button>
              </SheetTrigger>
            </li>

            <SheetContent
              side="bottom"
              closeLabel={menu.closeLabel}
              aria-describedby={undefined}
              className="gap-0"
            >
              <SheetHeader>
                <SheetTitle>{menu.title}</SheetTitle>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {menu.groups.map((group, index) => (
                  <div
                    key={group.key}
                    className={
                      index > 0
                        ? 'mt-1 border-t-[0.5px] border-border pt-1'
                        : ''
                    }
                  >
                    {group.label ? (
                      <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                        {group.label}
                      </p>
                    ) : null}
                    <ul>
                      {group.links.map((link) => {
                        const Icon = accountMenuIcons[link.key];
                        const isActive = isPathActive(link.href);
                        const showBadge = link.key === 'messages' && unread > 0;

                        return (
                          <li key={link.key}>
                            <Link
                              href={link.href}
                              onClick={() => setMenuOpen(false)}
                              aria-current={isActive ? 'page' : undefined}
                              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base text-foreground hover:bg-secondary ${
                                isActive ? 'bg-secondary' : ''
                              }`}
                            >
                              <Icon
                                className="size-5 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <span className="flex-1">{link.label}</span>
                              {showBadge ? (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-xs font-medium leading-none text-white">
                                  {formatBadgeCount(unread)}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}

                <div className="mt-1 border-t-[0.5px] border-border pt-1">
                  <SignOutButton
                    lng={menu.lng}
                    label={menu.signOutLabel}
                    variant="menu"
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </ul>
      </nav>
    </>
  );
}
