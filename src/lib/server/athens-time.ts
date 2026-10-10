const TIME_ZONE = 'Europe/Athens';

function offsetMs(instant: Date): number {
  const label =
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      timeZoneName: 'longOffset',
    })
      .formatToParts(instant)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(label);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0)) * 60_000;
}

function wallTime(instant: Date): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    day: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${pick('hour')}:${pick('minute')}`,
  };
}

export function athensDayStart(day: string): Date {
  const utcMidnight = new Date(`${day}T00:00:00Z`);
  return new Date(utcMidnight.getTime() - offsetMs(utcMidnight));
}

export function athensDayRange(day: string): { start: Date; end: Date } {
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return {
    start: athensDayStart(day),
    end: athensDayStart(next.toISOString().slice(0, 10)),
  };
}

export function athensDateTime(day: string, time: string): Date | null {
  const naive = new Date(`${day}T${time}:00Z`);
  if (Number.isNaN(naive.getTime())) return null;

  let result = new Date(naive.getTime() - offsetMs(naive));
  const corrected = new Date(naive.getTime() - offsetMs(result));
  if (corrected.getTime() !== result.getTime()) result = corrected;

  const back = wallTime(result);
  if (back.day !== day || back.time !== time) return null;

  return result;
}
