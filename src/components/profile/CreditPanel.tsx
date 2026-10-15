'use client';

import { useEffect, useState } from 'react';
import { formatAmount } from '@/lib/bookings/booking';
import { formatReviewDate } from '@/lib/fields/detail-format';
import {
  CREDIT_PAGE_SIZE,
  type CreditTransactionItem,
  type CreditTxTypeValue,
} from '@/lib/profile/profile';
import { fetchCreditHistory } from '@/lib/profile/profile-api';

export interface CreditPanelLabels {
  title: string;
  balance: string;
  history: string;
  loading: string;
  error: string;
  retry: string;
  emptyTitle: string;
  emptyDescription: string;
  loadMore: string;
  loadingMore: string;
  loadMoreError: string;
  types: Record<CreditTxTypeValue, string>;
}

export interface CreditPanelProps {
  lng: 'el' | 'en';
  labels: CreditPanelLabels;
}

type CreditState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ok';
      balance: number;
      items: CreditTransactionItem[];
      hasMore: boolean;
    };

function signedAmount(amount: number, lng: string): string {
  const formatted = formatAmount(Math.abs(amount), lng);
  return amount < 0 ? `−${formatted}` : `+${formatted}`;
}

export function CreditPanel({ lng, labels }: CreditPanelProps) {
  const [state, setState] = useState<CreditState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchCreditHistory({ offset: 0, limit: CREDIT_PAGE_SIZE }).then(
      (result) => {
        if (cancelled) return;
        setState(
          result.status === 'ok'
            ? {
                status: 'ok',
                balance: result.balance,
                items: result.items,
                hasMore: result.hasMore,
              }
            : { status: 'error' },
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function handleRetry() {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }

  async function handleLoadMore() {
    if (state.status !== 'ok' || loadingMore) return;

    setLoadingMore(true);
    setMoreError(false);

    const result = await fetchCreditHistory({
      offset: state.items.length,
      limit: CREDIT_PAGE_SIZE,
    });

    setLoadingMore(false);

    if (result.status !== 'ok') {
      setMoreError(true);
      return;
    }

    setState({
      status: 'ok',
      balance: result.balance,
      items: [...state.items, ...result.items],
      hasMore: result.hasMore,
    });
  }

  return (
    <section aria-labelledby="profile-credit-title">
      <h2 id="profile-credit-title" className="text-lg font-medium">
        {labels.title}
      </h2>

      {state.status === 'loading' ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {labels.loading}
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-destructive">
            {labels.error}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="h-10 rounded-full border-[0.5px] border-border bg-card px-4 text-sm font-medium hover:bg-secondary"
          >
            {labels.retry}
          </button>
        </div>
      ) : null}

      {state.status === 'ok' ? (
        <>
          <div className="mt-4 rounded-xl bg-accent px-4 py-4 text-accent-foreground">
            <p className="text-sm">{labels.balance}</p>
            <p className="mt-1 text-3xl font-medium">
              {formatAmount(state.balance, lng)}
            </p>
          </div>

          <h3 className="mt-6 text-base font-medium">{labels.history}</h3>

          {state.items.length === 0 ? (
            <div className="mt-3 rounded-xl border-[0.5px] border-border px-4 py-6 text-center">
              <p className="font-medium">{labels.emptyTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {labels.emptyDescription}
              </p>
            </div>
          ) : (
            <ul className="mt-2 flex flex-col">
              {state.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 border-t-[0.5px] border-border py-3 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm">{labels.types[item.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatReviewDate(new Date(item.createdAt), lng)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${item.amount < 0 ? 'text-terracotta' : 'text-primary'}`}
                  >
                    {signedAmount(item.amount, lng)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {moreError ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {labels.loadMoreError}
            </p>
          ) : null}

          {state.hasMore ? (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-3 h-10 w-full rounded-full border-[0.5px] border-border bg-card text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? labels.loadingMore : labels.loadMore}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
