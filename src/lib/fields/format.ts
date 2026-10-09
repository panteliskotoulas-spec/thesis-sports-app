// Η ώρα των slots εμφανίζεται πάντα στην ώρα Ελλάδας, ανεξάρτητα από τον server.
const TIME_ZONE = 'Europe/Athens';

// "15 €", "16,67 €" (δεκαδικά μόνο όταν χρειάζονται).
export function formatPricePerHour(value: number, lng: string): string {
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// "4,8" στα ελληνικά, "4.8" στα αγγλικά.
export function formatRating(value: number, lng: string): string {
  return new Intl.NumberFormat(lng, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

// Ημερομηνία σε μορφή YYYY-MM-DD στην ώρα Ελλάδας, για σύγκριση ημερών.
function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// "Σήμερα, 18:00" / "Αύριο, 10:00" / "Τρί 13 Οκτ, 09:00".
export function formatNextSlot(
  date: Date,
  lng: string,
  labels: { today: string; tomorrow: string },
  now: Date = new Date(),
): string {
  const time = new Intl.DateTimeFormat(lng, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

  const key = dayKey(date);
  if (key === dayKey(now)) return `${labels.today}, ${time}`;

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (key === dayKey(tomorrow)) return `${labels.tomorrow}, ${time}`;

  const day = new Intl.DateTimeFormat(lng, {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
  return `${day}, ${time}`;
}
