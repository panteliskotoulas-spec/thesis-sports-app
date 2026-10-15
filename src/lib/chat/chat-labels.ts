import type { getT } from '@/i18n.server';
import type { ChatInboxLabels } from '@/components/chat/ConversationList';
import type { ChatThreadLabels } from '@/components/chat/ChatThread';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildChatInboxLabels(tr: Translate): ChatInboxLabels {
  return {
    loading: tr('inbox.loading'),
    error: tr('inbox.error'),
    retry: tr('inbox.retry'),
    emptyTitle: tr('inbox.emptyTitle'),
    emptyDescription: tr('inbox.emptyDescription'),
    kindTeam: tr('inbox.kindTeam'),
    kindCoach: tr('inbox.kindCoach'),
    you: tr('inbox.you'),
    noMessages: tr('inbox.noMessages'),
    unreadOne: tr('inbox.unreadOne'),
    unreadOther: tr('inbox.unreadOther'),
    justNow: tr('inbox.justNow'),
  };
}

export function buildChatThreadLabels(tr: Translate): ChatThreadLabels {
  return {
    back: tr('thread.back'),
    membersOne: tr('thread.membersOne'),
    membersOther: tr('thread.membersOther'),
    loading: tr('thread.loading'),
    notFound: tr('thread.notFound'),
    error: tr('thread.error'),
    retry: tr('thread.retry'),
    empty: tr('thread.empty'),
    loadOlder: tr('thread.loadOlder'),
    loadingOlder: tr('thread.loadingOlder'),
    loadOlderError: tr('thread.loadOlderError'),
    today: tr('thread.today'),
    yesterday: tr('thread.yesterday'),
    you: tr('thread.you'),
    composerLabel: tr('thread.composerLabel'),
    placeholder: tr('thread.placeholder'),
    send: tr('thread.send'),
    sending: tr('thread.sending'),
    counter: tr('thread.counter'),
    readOnly: tr('thread.readOnly'),
    errorEmpty: tr('thread.errorEmpty'),
    errorTooLong: tr('thread.errorTooLong'),
    errorRateLimited: tr('thread.errorRateLimited'),
    errorReadOnly: tr('thread.errorReadOnly'),
    errorUnauthorized: tr('thread.errorUnauthorized'),
    errorGeneric: tr('thread.errorGeneric'),
  };
}
