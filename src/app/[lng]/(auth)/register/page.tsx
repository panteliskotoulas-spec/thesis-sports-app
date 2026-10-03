import type { Metadata } from 'next';
import Link from 'next/link';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/components/auth/RegisterForm';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('auth');
  return { title: t('register.pageTitle') };
}

export default async function RegisterPage() {
  const { t } = await getT('auth');
  const lng = await routeLanguage();

  return (
    <AuthCard
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <p className="text-muted-foreground">
          {t('register.haveAccount')}{' '}
          <Link
            href={`/${lng}/login`}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            {t('register.login')}
          </Link>
        </p>
      }
    >
      <RegisterForm
        lng={lng}
        labels={{
          accountType: t('register.accountType'),
          individual: t('register.individual'),
          business: t('register.business'),
          name: t('register.name'),
          nameBusiness: t('register.nameBusiness'),
          businessName: t('register.businessName'),
          taxId: t('register.taxId'),
          taxIdHint: t('register.taxIdHint'),
          email: t('register.email'),
          password: t('register.password'),
          passwordHint: t('register.passwordHint'),
          submit: t('register.submit'),
          submitting: t('register.submitting'),
          errorGeneric: t('register.errorGeneric'),
          errorEmailTaken: t('register.errorEmailTaken'),
        }}
      />
    </AuthCard>
  );
}
