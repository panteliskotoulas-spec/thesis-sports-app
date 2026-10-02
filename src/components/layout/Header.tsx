import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export interface HeaderProps {
  user: { name: string; avatarUrl?: string } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b-[0.5px] border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="text-foreground" href="/">
          Sports App
        </Link>

        {/* Hidden on mobile — becomes a hamburger menu once we add
            client-side state. Don't try to "squeeze" it in for now. */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/fields"
                className="text-muted-foreground hover:text-foreground"
              >
                Fields
              </Link>
            </li>
            <li>
              <Link
                href="/teams"
                className="text-muted-foreground hover:text-foreground"
              >
                Teams
              </Link>
            </li>
            <li>
              <Link
                href="/coaches"
                className="text-muted-foreground hover:text-foreground"
              >
                Coaches
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <Link href="/profile" className="ml-1">
              <span className="text-foreground">{user.name}</span>
            </Link>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Link
                className="rounded-full border-[0.5px] border-border px-4 py-1.5 text-foreground hover:bg-secondary"
                href="/login"
              >
                Σύνδεση
              </Link>
              <Link
                className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90"
                href="/register"
              >
                Εγγραφή
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
