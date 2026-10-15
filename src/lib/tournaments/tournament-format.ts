const TIME_ZONE = 'Europe/Athens';

export function formatCount(value: number, lng: string): string {
  return new Intl.NumberFormat(lng, { maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number, lng: string): string {
  return new Intl.NumberFormat(lng, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatTournamentDates(
  start: string,
  end: string,
  lng: string,
): string {
  return new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).formatRange(new Date(start), new Date(end));
}

export function formatMatchDate(iso: string, lng: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(lng, {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
  const time = new Intl.DateTimeFormat(lng, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${day}, ${time}`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
