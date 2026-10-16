import Link from 'next/link';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { getT } from '@/i18n.server';
import type { DashboardActions } from '@/lib/home/dashboard';

export async function ActionNeededCard({
  actions,
}: {
  actions: DashboardActions;
}) {
  if (actions.total === 0) return null;

  const { t } = await getT('home');
  const hidden = actions.total - actions.items.length;

  return (
    <section
      aria-labelledby="dashboard-actions-title"
      className="rounded-xl border-[0.5px] border-terracotta bg-card p-4 sm:p-5"
    >
      <h2
        id="dashboard-actions-title"
        className="flex items-center gap-2 text-lg"
      >
        <CircleAlert className="size-5 text-terracotta" aria-hidden="true" />
        {t('dashboard.actions.title')}
      </h2>

      <ul className="mt-2">
        {actions.items.map((item) => (
          <li
            key={item.key}
            className="border-t-[0.5px] border-border first:border-t-0"
          >
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg py-3 hover:bg-secondary"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  {item.title}
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {t(`dashboard.actions.kind.${item.kind}`)}
                  {item.context ? ` · ${item.context}` : ''}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {item.kind === 'SESSION_PAYMENT'
                    ? t('dashboard.actions.deadline', { when: item.when })
                    : item.when}
                </span>
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {item.amount}
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>

      {hidden > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('dashboard.actions.more', { count: hidden })}
        </p>
      ) : null}
    </section>
  );
}
