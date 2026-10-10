const TIME_ZONE = 'Europe/Athens';

function dayDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

export function formatTimeRange(start: Date, end: Date, lng: string): string {
  const formatter = new Intl.DateTimeFormat(lng, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

export function formatDayChip(
  day: string,
  lng: string,
): { weekday: string; dayNumber: string; full: string } {
  const date = dayDate(day);
  return {
    weekday: new Intl.DateTimeFormat(lng, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(date),
    dayNumber: new Intl.DateTimeFormat(lng, {
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
    full: new Intl.DateTimeFormat(lng, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(date),
  };
}

export function formatDayShort(day: string, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(dayDate(day));
}

export function formatReviewDate(date: Date, lng: string): string {
  return new Intl.DateTimeFormat(lng, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date);
}

export function buildMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
