'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CalendarX,
  Clock,
  Hourglass,
  Lock,
  MapPin,
} from 'lucide-react';
import {
  fillTemplate,
  formatAmount,
  type StartCheckoutResult,
} from '@/lib/bookings/booking';
import { startCheckout } from '@/lib/bookings/booking-api';
import {
  computePaymentSplit,
  fromCents,
  toCents,
} from '@/lib/bookings/payment-split';
import { CreditToggle, type CreditToggleLabels } from './CreditToggle';

export interface BookingSummaryLabels {
  credit: CreditToggleLabels;
  priceRow: string;
  creditRow: string;
  cardRow: string;
  totalRow: string;
  methodRow: string;
  methodCard: string;
  methodCredit: string;
  methodMixed: string;
  holdNote: string;
  cancelNote: string;
  payCard: string;
  confirm: string;
  working: string;
  stripeNote: string;
  backToField: string;
  errorTaken: string;
  errorMinimum: string;
  errorInvalid: string;
  errorGeneric: string;
}

export interface BookingSummaryProps {
  lng: string;
  slotId: string;
  fieldName: string;
  sport: string;
  date: string;
  time: string;
  location: string | null;
  price: number;
  balance: number;
  backHref: string;
  labels: BookingSummaryLabels;
}

const badgeClass =
  'inline-flex shrink-0 items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground';

function errorFor(
  result: StartCheckoutResult,
  labels: BookingSummaryLabels,
): string | null {
  if (result.status === 'conflict') return labels.errorTaken;
  if (result.status === 'invalid') return labels.errorInvalid;
  if (result.status === 'error') return labels.errorGeneric;
  return null;
}

export function BookingSummary({
  lng,
  slotId,
  fieldName,
  sport,
  date,
  time,
  location,
  price,
  balance,
  backHref,
  labels,
}: BookingSummaryProps) {
  const router = useRouter();
  const [useCredit, setUseCredit] = useState(balance > 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState(false);

  const split = computePaymentSplit(
    toCents(price),
    toCents(balance),
    useCredit,
  );
  const cardAmount = fromCents(split.cardCents);
  const creditAmount = fromCents(split.creditCents);

  const methodText =
    split.method === 'CARD'
      ? labels.methodCard
      : split.method === 'CREDIT'
        ? labels.methodCredit
        : labels.methodMixed;

  const submitText = busy
    ? labels.working
    : split.cardCents > 0
      ? fillTemplate(labels.payCard, { amount: formatAmount(cardAmount, lng) })
      : labels.confirm;

  async function handleSubmit() {
    if (busy || !split.valid) return;

    setBusy(true);
    setError(null);
    setTaken(false);

    const result = await startCheckout({ slotId, useCredit, lng });

    if (result.status === 'redirect') {
      window.location.assign(result.url);
      return;
    }

    if (result.status === 'confirmed') {
      router.push(`/${lng}/bookings?booked=1`);
      return;
    }

    if (result.status === 'unauthorized') {
      router.push(`/${lng}/login`);
      return;
    }

    setBusy(false);
    setError(errorFor(result, labels));
    setTaken(result.status === 'conflict');
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border-[0.5px] border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg">{fieldName}</h2>
          <span className={badgeClass}>{sport}</span>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {date}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {time}
          </li>
          {location ? (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {location}
            </li>
          ) : null}
        </ul>
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
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{labels.priceRow}</dt>
            <dd>{formatAmount(price, lng)}</dd>
          </div>
          {split.creditCents > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{labels.creditRow}</dt>
              <dd>−{formatAmount(creditAmount, lng)}</dd>
            </div>
          ) : null}
          <div className="mt-1.5 flex justify-between gap-3 border-t-[0.5px] border-border pt-2.5 font-medium">
            <dt>{split.cardCents > 0 ? labels.cardRow : labels.totalRow}</dt>
            <dd>{formatAmount(cardAmount, lng)}</dd>
          </div>
        </dl>
        <p className="mt-2.5 text-xs text-muted-foreground">
          {labels.methodRow}{' '}
          <span className="font-medium text-foreground">{methodText}</span>
        </p>
      </section>

      <ul className="flex flex-col gap-1.5 px-0.5 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <Hourglass className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {labels.holdNote}
        </li>
        <li className="flex items-start gap-2">
          <CalendarX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {labels.cancelNote}
        </li>
      </ul>

      {!split.valid ? (
        <p role="alert" className="text-sm text-destructive">
          {labels.errorMinimum}
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="text-sm text-destructive">
          <p>{error}</p>
          {taken ? (
            <Link
              href={backHref}
              className="mt-1 inline-block underline underline-offset-2"
            >
              {labels.backToField}
            </Link>
          ) : null}
        </div>
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
