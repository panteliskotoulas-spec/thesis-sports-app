import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ArrowLeft } from 'lucide-react';
import { getT } from '@/i18n.server';
import { ChatThread } from '@/components/chat/ChatThread';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { buildChatThreadLabels } from '@/lib/chat/chat-labels';
import { getCurrentUser } from '@/lib/session';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT('chat');
  return { title: t('meta.thread') };
}

function resolveFrom(value: string | string[] | undefined, lng: string) {
  if (typeof value !== 'string') return null;
  if (!value.startsWith(`/${lng}/`) || value.startsWith('//')) return null;
  return value;
}

export default async function MessageThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { t } = await getT('chat');
  const lng = await routeLanguage();
  const user = await getCurrentUser();

  if (!user) redirect(`/${lng}/login`);

  const language = lng === 'en' ? 'en' : 'el';
  const from = resolveFrom(query.from, lng);
  const backHref = from ?? `/${lng}/messages`;
  const backLabel = from ? t('thread.backPrevious') : t('thread.back');

  return (
    <>
      <Header user={user} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 md:py-10">
        <Link
          href={backHref}
          className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>

        <div className="mt-2">
          <ChatThread
            lng={language}
            conversationId={id}
            backHref={backHref}
            labels={{ ...buildChatThreadLabels(t), back: backLabel }}
          />
        </div>
      </main>
      <BottomNav user={user} />
    </>
  );
}
