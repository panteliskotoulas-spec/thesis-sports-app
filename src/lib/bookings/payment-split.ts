export const MIN_CARD_CENTS = 50;

export type PaymentMethodValue = 'CARD' | 'CREDIT' | 'MIXED';

export interface PaymentSplit {
  creditCents: number;
  cardCents: number;
  method: PaymentMethodValue;
  limited: boolean;
  valid: boolean;
}

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function computePaymentSplit(
  priceCents: number,
  balanceCents: number,
  useCredit: boolean,
): PaymentSplit {
  const price = Math.max(0, Math.round(priceCents));
  const balance = Math.max(0, Math.round(balanceCents));
  const wanted = useCredit ? Math.min(balance, price) : 0;

  let credit = wanted;
  if (credit > 0 && price - credit > 0 && price - credit < MIN_CARD_CENTS) {
    credit = Math.max(0, price - MIN_CARD_CENTS);
  }

  const card = price - credit;
  const method: PaymentMethodValue =
    credit === 0 ? 'CARD' : card === 0 ? 'CREDIT' : 'MIXED';

  return {
    creditCents: credit,
    cardCents: card,
    method,
    limited: credit !== wanted,
    valid: price > 0 && (card === 0 || card >= MIN_CARD_CENTS),
  };
}
