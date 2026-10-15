import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { getT } from '@/i18n.server';
import { ConversationList } from '@/components/chat/ConversationList';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { buildChatInboxLabels } from '@/lib/chat/chat-labels';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('chat');
  return { title: t('meta.inbox') };
}

export default async function MessagesPage() {
  const { t } = await getT('chat');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const language = lng === 'en' ? 'en' : 'el';

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <h1>{t('inbox.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('inbox.subtitle')}</p>

        <div className="mt-6">
          <ConversationList lng={language} labels={buildChatInboxLabels(t)} />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
