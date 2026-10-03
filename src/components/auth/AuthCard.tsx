import Image from 'next/image';

export interface AuthCardProps {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <div className="grid w-full max-w-md overflow-hidden rounded-xl border-[0.5px] border-border bg-card text-card-foreground lg:max-w-4xl lg:grid-cols-2">
      <section className="p-6 sm:p-8 lg:p-10">
        <h1>{title}</h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>

        <div className="mt-6">{children}</div>

        <div className="mt-6 text-center">{footer}</div>
      </section>

      <div aria-hidden="true" className="relative hidden bg-accent lg:block">
        <Image
          src="/images/login.jpg"
          alt=""
          fill
          sizes="448px"
          loading="eager"
          className="object-cover dark:brightness-90"
        />
      </div>
    </div>
  );
}
