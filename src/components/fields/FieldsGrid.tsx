import type { ReactNode } from 'react';

export function FieldsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">
      {children}
    </div>
  );
}
