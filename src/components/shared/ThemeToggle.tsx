import { Sun } from 'lucide-react';

export function ThemeToggle() {
  return (
    <button type="button" aria-label="Switch to dark mode">
      <Sun className="h-4 w-4" />
    </button>
  );
}
