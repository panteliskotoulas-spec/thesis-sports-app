'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { SignOutButton } from '@/components/shared/SignOutButton';
import type { AccountMenuGroup } from '@/lib/layout/account-menu';
import { accountMenuIcons } from './account-menu-icons';

export interface UserMenuProps {
  name: string;
  initials: string;
  lng: string;
  groups: AccountMenuGroup[];
  menuLabel: string;
  signOutLabel: string;
}

export function UserMenu({
  name,
  initials,
  lng,
  groups,
  menuLabel,
  signOutLabel,
}: UserMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => !link.mobileOnly),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="user-menu-panel"
        aria-label={menuLabel}
        className="flex items-center gap-1 rounded-full p-1 pr-2 hover:bg-secondary"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm text-foreground"
        >
          {initials}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          id="user-menu-panel"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border-[0.5px] border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-foreground"
            >
              {initials}
            </span>
            <span className="truncate text-foreground">{name}</span>
          </div>
          <div className="mt-1 border-t-[0.5px] border-border" />
          {visibleGroups.map((group, index) => (
            <div
              key={group.key}
              className={
                index > 0 ? 'mt-1 border-t-[0.5px] border-border pt-1' : ''
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
                  const isActive =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);

                  return (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-foreground hover:bg-secondary ${
                          isActive ? 'bg-secondary' : ''
                        }`}
                      >
                        <Icon
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="mt-1 border-t-[0.5px] border-border pt-1">
            <SignOutButton lng={lng} label={signOutLabel} variant="menu" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
