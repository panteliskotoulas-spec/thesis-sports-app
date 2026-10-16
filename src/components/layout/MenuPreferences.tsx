'use client';

import { Globe, Moon, Sun } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useT } from 'next-i18next/client';
import { useTheme } from 'next-themes';

const rowClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-foreground hover:bg-secondary';

export function MenuPreferences() {
  const { t, i18n } = useT('common');
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  function handleLanguage() {
    const next = i18n.language === 'el' ? 'en' : 'el';
    document.cookie = `i18next=${next};path=/;max-age=31536000;SameSite=Lax`;
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(
      segments.join('/') + window.location.search + window.location.hash,
    );
  }

  return (
    <ul>
      <li>
        <button type="button" onClick={handleLanguage} className={rowClass}>
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">{t('language.switch')}</span>
          <span className="rounded-full border-[0.5px] border-border px-2 text-xs uppercase text-muted-foreground">
            {i18n.language}
          </span>
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className={rowClass}
        >
          <Moon
            className="size-4 text-muted-foreground dark:hidden"
            aria-hidden="true"
          />
          <Sun
            className="hidden size-4 text-muted-foreground dark:block"
            aria-hidden="true"
          />
          <span className="flex-1">{t('theme.toggle')}</span>
        </button>
      </li>
    </ul>
  );
}
