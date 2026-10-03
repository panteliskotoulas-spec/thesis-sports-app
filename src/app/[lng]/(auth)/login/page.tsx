import type { Metadata } from 'next';
import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('auth');
  return { title: t('login.pageTitle') };
}

export default async function LoginPage() {
  const { t } = await getT('auth');
  const lng = await routeLanguage();

  return (
    <AuthCard
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <p>
          {t('login.noAccount')}{' '}
          <Link href={`/${lng}/register`}>{t('login.register')}</Link>
        </p>
      }
    >
      <LoginForm
        lng={lng}
        labels={{
          email: t('login.email'),
          password: t('login.password'),
          forgot: t('login.forgot'),
          submit: t('login.submit'),
          submitting: t('login.submitting'),
          errorInvalid: t('login.errorInvalid'),
          errorGeneric: t('login.errorGeneric'),
        }}
      />
    </AuthCard>
  );
}
