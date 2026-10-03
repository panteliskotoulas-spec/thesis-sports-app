'use client';

import { Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useT } from 'next-i18next/client';

export function LanguageSwitcher() {
  const { t, i18n } = useT('common');
  const pathname = usePathname();
  const router = useRouter();

  function handleClick() {
    const next = i18n.language === 'el' ? 'en' : 'el';
    document.cookie = `i18next=${next};path=/;max-age=31536000;SameSite=Lax`;
    const segments = pathname.split('/');
    segments[1] = next;
    router.push(
      segments.join('/') + window.location.search + window.location.hash,
    );
  }

  return (
    <button
      type="button"
      aria-label={t('language.switch')}
      onClick={handleClick}
      className="inline-flex h-9 items-center justify-center gap-1 rounded-full px-2.5 text-foreground hover:bg-secondary"
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs uppercase">{i18n.language}</span>
    </button>
  );
}
