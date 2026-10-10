export interface NewFieldSectionProps {
  title: string;
  children: React.ReactNode;
}

export function NewFieldSection({ title, children }: NewFieldSectionProps) {
  return (
    <section className="flex min-w-0 flex-col rounded-xl border-[0.5px] border-border bg-card p-4 sm:p-5">
      <h2 className="text-lg">{title}</h2>
      <div className="mt-4 flex flex-1 flex-col gap-4">{children}</div>
    </section>
  );
}
