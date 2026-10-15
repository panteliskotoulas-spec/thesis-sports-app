import { CalendarDays, Search, Users } from 'lucide-react';
import { getT } from '@/i18n.server';

export async function HomeSteps() {
  const { t } = await getT('home');

  const steps = [
    {
      icon: Search,
      title: t('steps.find.title'),
      description: t('steps.find.description'),
    },
    {
      icon: CalendarDays,
      title: t('steps.book.title'),
      description: t('steps.book.description'),
    },
    {
      icon: Users,
      title: t('steps.play.title'),
      description: t('steps.play.description'),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-360 px-4 py-10 sm:px-6 md:py-16 lg:px-8">
      <div className="text-center">
        <h2>{t('steps.title')}</h2>
        <p className="mt-1 text-muted-foreground">{t('steps.subtitle')}</p>
      </div>
      <ol className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <step.icon className="size-5" aria-hidden="true" />
            </span>
            <h3>
              {index + 1}. {step.title}
            </h3>
            <p className="text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
