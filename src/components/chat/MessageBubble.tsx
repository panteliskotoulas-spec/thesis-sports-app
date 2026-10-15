import type { ChatMessage } from '@/lib/chat/chat';

export interface MessageBubbleProps {
  message: ChatMessage;
  time: string;
  showSender: boolean;
  youLabel: string;
}

export function MessageBubble({
  message,
  time,
  showSender,
  youLabel,
}: MessageBubbleProps) {
  const mine = message.isMine;

  return (
    <li className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {showSender && !mine ? (
        <span className="mb-0.5 px-1 text-xs text-muted-foreground">
          {message.senderName}
        </span>
      ) : null}
      <div
        className={`max-w-[80%] whitespace-pre-wrap wrap-break-word  rounded-2xl px-3 py-2 text-sm leading-snug ${
          mine
            ? 'bg-primary text-primary-foreground'
            : 'border-[0.5px] border-border bg-card text-foreground'
        }`}
      >
        {mine ? <span className="sr-only">{youLabel}: </span> : null}
        {message.content}
      </div>
      <span className="mt-0.5 px-1 text-xs text-muted-foreground">{time}</span>
    </li>
  );
}
