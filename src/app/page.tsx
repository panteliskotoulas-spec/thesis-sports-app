import { Header } from '@/components/layout/Header';

const mockUser = null;
export default function LandingPage() {
  return (
    <>
      <Header user={mockUser} />
      <main>
        <p>Test content</p>
      </main>
    </>
  );
}
