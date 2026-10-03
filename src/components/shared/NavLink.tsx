'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

// Link του nav που ξέρει αν είναι ενεργό (ταιριάζει με το URL ή με υποσελίδα του).
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`rounded-full px-3.5 py-1.5 hover:bg-secondary hover:text-foreground ${
        isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  );
}
