'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Lock, Users } from 'lucide-react';
import {
  CreditToggle,
  type CreditToggleLabels,
} from '@/components/bookings/CreditToggle';
import { fillTemplate, formatAmount } from '@/lib/bookings/booking';
import {
  computePaymentSplit,
  fromCents,
  toCents,
} from '@/lib/bookings/payment-split';
import { startSplitCheckout } from '@/lib/teams/team-split-api';

export interface TeamSplitPaymentLabels {
  credit: CreditToggleLabels;
  shareLabel: string;
  creditRow: string;
  cardRow: string;
  totalRow: string;
  payCard: string;
  confirm: string;
  working: string;
  stripeNote: string;
  refundNote: string;
  errorMinimum: string;
  errorUnavailable: string;
  errorGeneric: string;
}

export interface TeamSplitPaymentProps {
  lng: string;
  reservationId: string;
  fieldName: string;
  date: string;
  time: string;
  leaderName: string;
  share: number;
  balance: number;
  backHref: string;
  labels: TeamSplitPaymentLabels;
}

export function TeamSplitPayment({
  lng,
  reservationId,
  fieldName,
  date,
  time,
  leaderName,
  share,
  balance,
  backHref,
  labels,
}: TeamSplitPaymentProps) {
  const router = useRouter();
  const [useCredit, setUseCredit] = useState(balance > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const split = computePaymentSplit(
    toCents(share),
    toCents(balance),
    useCredit,
  );
  const cardAmount = fromCents(split.cardCents);
  const creditAmount = fromCents(split.creditCents);

  const submitText = busy
    ? labels.working
    : split.cardCents > 0
      ? fillTemplate(labels.payCard, { amount: formatAmount(cardAmount, lng) })
      : labels.confirm;

  async function handleSubmit() {
    if (busy || !split.valid) return;

    setBusy(true);
    setError(null);

    const result = await startSplitCheckout({ reservationId, useCredit, lng });

    if (result.status === 'redirect') {
      window.location.assign(result.url);
      return;
    }

    if (result.status === 'paid') {
      router.push(`${backHref}?split=paid`);
      return;
    }

    if (result.status === 'unauthorized') {
      router.push(`/${lng}/login`);
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
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border-[0.5px] border-border bg-card p-4">
        <h2 className="text-lg">{fieldName}</h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {date}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {time}
          </li>
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary p-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {fillTemplate(labels.shareLabel, { name: leaderName })}
            </p>
            <p className="mt-0.5 text-2xl font-medium">
              {formatAmount(share, lng)}
            </p>
          </div>
          <Users
            className="size-6 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </section>

      <CreditToggle
        balanceText={formatAmount(balance, lng)}
        hasBalance={balance > 0}
        checked={useCredit}
        limited={split.limited && split.valid}
        labels={labels.credit}
        onChange={setUseCredit}
      />

      <section className="rounded-xl border-[0.5px] border-border bg-card p-4 text-sm">
        <dl className="flex flex-col gap-1.5">
          {split.creditCents > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{labels.creditRow}</dt>
              <dd>−{formatAmount(creditAmount, lng)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 font-medium">
            <dt>{split.cardCents > 0 ? labels.cardRow : labels.totalRow}</dt>
            <dd>{formatAmount(cardAmount, lng)}</dd>
          </div>
        </dl>
      </section>

      <p className="px-0.5 text-sm text-muted-foreground">
        {labels.refundNote}
      </p>

      {!split.valid ? (
        <p role="alert" className="text-sm text-destructive">
          {labels.errorMinimum}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          disabled={busy || !split.valid}
          onClick={handleSubmit}
          className="h-11 w-full rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitText}
        </button>
        {split.cardCents > 0 ? (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" />
            {labels.stripeNote}
          </p>
        ) : null}
      </div>
    </div>
  );
}
