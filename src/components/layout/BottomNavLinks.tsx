'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Home, MapPin, User } from 'lucide-react';

// Οι Server Components δεν μπορούν να περάσουν components ως props,
// γι' αυτό περνάμε ένα κλειδί και το εικονίδιο επιλέγεται εδώ.
const icons = {
  home: Home,
  fields: MapPin,
  bookings: CalendarDays,
  profile: User,
} as const;

export interface BottomNavItem {
  icon: keyof typeof icons;
  href: string;
  label: string;
  exact?: boolean;
}

export interface BottomNavLinksProps {
  label: string;
  items: BottomNavItem[];
}

export function BottomNavLinks({ label, items }: BottomNavLinksProps) {
  const pathname = usePathname();

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
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`flex h-7 w-14 items-center justify-center rounded-full ${
                      isActive ? 'bg-secondary' : ''
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
