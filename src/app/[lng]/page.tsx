import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { getCurrentUser } from '@/lib/session';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user} />
      <main>
        <p>Test content</p>
      </main>
      <BottomNav user={user} />
    </>
  );
}
