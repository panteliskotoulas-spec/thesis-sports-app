'use client';

import { useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { openConversation } from '@/lib/chat/chat-api';
import type { OpenConversationInput } from '@/lib/chat/chat';

export interface OpenChatLabels {
  open: string;
  opening: string;
  errorUnavailable: string;
  errorGeneric: string;
}

export interface OpenChatButtonProps {
  target: OpenConversationInput;
  labels: OpenChatLabels;
}

export function OpenChatButton({ target, labels }: OpenChatButtonProps) {
  const router = useRouter();
  const params = useParams<{ lng: string }>();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await openConversation(target);

    if (result.status === 'ok') {
      router.push(
        `/${params.lng}/messages/${result.conversationId}?from=${encodeURIComponent(pathname)}`,
      );
      return;
    }

    setBusy(false);
    setError(
      result.status === 'unavailable'
        ? labels.errorUnavailable
        : labels.errorGeneric,
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        {busy ? labels.opening : labels.open}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
