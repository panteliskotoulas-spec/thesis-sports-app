import type {
  CoachRequestRow,
  CoachSessionRow,
} from '@/lib/coaches/coach-session';

function at(now: Date, days: number, hour: number, minutes: number): Date {
  const date = new Date(now.getTime() + days * 86_400_000);
  date.setUTCHours(hour, minutes, 0, 0);
  return date;
}

function after(now: Date, hours: number): Date {
  return new Date(now.getTime() + hours * 3_600_000);
}

export function mockCoachSessionRows(
  now: Date = new Date(),
): CoachSessionRow[] {
  return [
    {
      id: 'mock-s1',
      coachId: 'mock-c1',
      coachName: 'Νίκος Παπαδόπουλος',
      sportType: 'TENNIS',
      startTime: at(now, 3, 8, 0),
      endTime: at(now, 3, 9, 30),
      price: 27,
      credit: 0,
      state: 'REQUESTED',
      payBy: null,
      wasPaid: false,
      compensation: null,
      teamName: null,
    },
    {
      id: 'mock-s2',
      coachId: 'mock-c1',
      coachName: 'Νίκος Παπαδόπουλος',
      sportType: 'TENNIS',
      startTime: at(now, 4, 17, 0),
      endTime: at(now, 4, 18, 0),
      price: 20,
      credit: 5,
      state: 'AWAITING_PAYMENT',
      payBy: after(now, 21),
      wasPaid: false,
      compensation: null,
      teamName: null,
    },
    {
      id: 'mock-s3',
      coachId: 'mock-c2',
      coachName: 'Άννα Λαμπράκη',
      sportType: 'BASKETBALL',
      startTime: at(now, 6, 16, 0),
      endTime: at(now, 6, 17, 0),
      price: 18,
      credit: 0,
      state: 'CONFIRMED',
      payBy: null,
      wasPaid: true,
      compensation: null,
      teamName: 'Αετοί',
    },
    {
      id: 'mock-s4',
      coachId: 'mock-c2',
      coachName: 'Άννα Λαμπράκη',
      sportType: 'BASKETBALL',
      startTime: at(now, 7, 15, 0),
      endTime: at(now, 7, 16, 0),
      price: 18,
      credit: 0,
      state: 'REJECTED',
      payBy: null,
      wasPaid: false,
      compensation: null,
      teamName: null,
    },
    {
      id: 'mock-s5',
      coachId: 'mock-c1',
      coachName: 'Νίκος Παπαδόπουλος',
      sportType: 'TENNIS',
      startTime: at(now, 9, 9, 0),
      endTime: at(now, 9, 10, 0),
      price: 22,
      credit: 0,
      state: 'CANCELLED',
      payBy: null,
      wasPaid: true,
      compensation: 'REFUND',
      teamName: null,
    },
  ];
}

export function mockCoachRequestRows(
  now: Date = new Date(),
): CoachRequestRow[] {
  return [
    {
      id: 'mock-r1',
      requesterName: 'Μαρία Κωστοπούλου',
      teamName: null,
      startTime: at(now, 2, 8, 0),
      endTime: at(now, 2, 9, 30),
      price: 27,
      state: 'PENDING',
      payment: null,
      payBy: null,
    },
    {
      id: 'mock-r2',
      requesterName: 'Γιάννης Δημητρίου',
      teamName: 'Αετοί',
      startTime: at(now, 3, 17, 0),
      endTime: at(now, 3, 18, 0),
      price: 20,
      state: 'PENDING',
      payment: null,
      payBy: null,
    },
    {
      id: 'mock-r3',
      requesterName: 'Ελένη Σταύρου',
      teamName: null,
      startTime: at(now, 4, 16, 0),
      endTime: at(now, 4, 17, 0),
      price: 18,
      state: 'ACCEPTED',
      payment: 'AWAITING',
      payBy: after(now, 21),
    },
    {
      id: 'mock-r4',
      requesterName: 'Κώστας Μαυρίδης',
      teamName: null,
      startTime: at(now, 5, 15, 0),
      endTime: at(now, 5, 16, 0),
      price: 18,
      state: 'ACCEPTED',
      payment: 'PAID',
      payBy: null,
    },
    {
      id: 'mock-r5',
      requesterName: 'Σοφία Ντίνου',
      teamName: null,
      startTime: at(now, 6, 14, 0),
      endTime: at(now, 6, 15, 0),
      price: 18,
      state: 'REJECTED',
      payment: null,
      payBy: null,
    },
  ];
}
