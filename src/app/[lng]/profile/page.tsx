import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { parseProfileTab } from '@/lib/profile/profile';
import { buildProfileLabels } from '@/lib/profile/profile-labels';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('profile');
  return { title: t('meta.title') };
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { t } = await getT('profile');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const language = lng === 'en' ? 'en' : 'el';
  const tab = parseProfileTab((await searchParams).tab);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('page.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('page.subtitle')}</p>

        <div className="mt-6">
          <ProfileSettings
            lng={language}
            initialTab={tab}
            user={{
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl ?? null,
              accountType:
                user.accountType === 'BUSINESS' ? 'BUSINESS' : 'INDIVIDUAL',
              businessName: user.businessName ?? null,
              taxId: user.taxId ?? null,
            }}
            labels={buildProfileLabels(t)}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
