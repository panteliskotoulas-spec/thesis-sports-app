import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  return (
    <button type="button" aria-label="Switch language">
      <Globe className="h-4 w-4" />
    </button>
  );
}
