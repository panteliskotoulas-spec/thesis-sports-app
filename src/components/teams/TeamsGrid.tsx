import type { ReactNode } from 'react';

export function TeamsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {children}
    </div>
  );
}
