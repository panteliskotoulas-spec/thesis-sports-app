import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export interface HeaderProps {
  user: { name: string; avatarUrl?: string } | null;
}

const navLinkClass =
  'rounded-full px-3.5 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground';

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b-[0.5px] border-border bg-background">
      <div className="border-b-[0.5px] border-border bg-secondary md:hidden">
        <div className="mx-auto flex h-9 max-w-360 items-center justify-end gap-1 px-4 sm:px-6">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-360 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-10">
          <Link className="whitespace-nowrap text-foreground" href="/">
            Sports App
          </Link>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-1 lg:gap-2">
              <li>
                <Link href="/fields" className={navLinkClass}>
                  Fields
                </Link>
              </li>
              <li>
                <Link href="/teams" className={navLinkClass}>
                  Teams
                </Link>
              </li>
              <li>
                <Link href="/coaches" className={navLinkClass}>
                  Coaches
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center">
          <div className="hidden items-center gap-1 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          </div>

          {user ? (
            <Link href="/profile">
              <span className="text-foreground">{user.name}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="whitespace-nowrap rounded-full border-[0.5px] border-border px-4 py-1.5 text-foreground hover:bg-secondary md:border-transparent"
                href="/login"
              >
                Σύνδεση
              </Link>
              <Link
                className="whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90"
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
