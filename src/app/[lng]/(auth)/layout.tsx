import { Header } from '@/components/layout/Header';
// import { Footer } from '@/components/layout/Footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header user={null} />
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>
      {/* <Footer /> */}
    </>
  );
}
