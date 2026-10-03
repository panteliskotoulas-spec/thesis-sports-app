import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { getCurrentUser } from '@/lib/session';
// import { Footer } from '@/components/layout/Footer';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <Header user={user} />
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>
      {/* <Footer /> */}
      <BottomNav user={user} />
    </>
  );
}
