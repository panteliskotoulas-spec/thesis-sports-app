import { getT } from '@/i18n.server';
import type { AdminDashboardData } from '@/lib/home/admin-dashboard';
import { AdminSection } from './AdminSection';
import { CardMessage } from './DashboardCard';

export interface AdminDashboardProps {
  name: string;
  data: AdminDashboardData | null;
}

export async function AdminDashboard({ name, data }: AdminDashboardProps) {
  const { t } = await getT('home');
  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <section className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <h1>{t('dashboard.greeting', { name: firstName })}</h1>
      {data ? (
        <AdminSection data={data} />
      ) : (
        <div className="mt-6">
          <CardMessage>{t('dashboard.error')}</CardMessage>
        </div>
      )}
    </section>
  );
}
