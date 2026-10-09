import type { FieldListRow } from './types';

// Μέρα (σε σχέση με σήμερα) και ώρα, για να βγαίνουν πάντα μελλοντικά slots.
function at(daysFromNow: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export function getMockFields(): FieldListRow[] {
  return [
    {
      id: 'mock-1',
      name: {
        el: 'Αθλητικό Κέντρο Ηλιούπολης',
        en: 'Ilioupoli Sports Center',
      },
      area: { el: 'Ηλιούπολη, Αττική', en: 'Ilioupoli, Attica' },
      indoor: false,
      sports: ['FOOTBALL', 'BASKETBALL'],
      imageUrl: null,
      rating: { average: 4.8, count: 24 },
      nextSlotAt: at(0, 18),
      pricePerHourFrom: 15,
    },
    {
      id: 'mock-2',
      name: {
        el: 'Κλειστό Γυμναστήριο Καλαμαριάς',
        en: 'Kalamaria Indoor Gym',
      },
      area: { el: 'Καλαμαριά, Θεσσαλονίκη', en: 'Kalamaria, Thessaloniki' },
      indoor: true,
      sports: ['BASKETBALL', 'VOLLEYBALL'],
      imageUrl: null,
      rating: { average: 4.5, count: 12 },
      nextSlotAt: at(1, 10),
      pricePerHourFrom: 12,
    },
    {
      id: 'mock-3',
      name: { el: 'Γήπεδο 5x5 Νέας Σμύρνης', en: 'Nea Smyrni 5x5 Pitch' },
      area: { el: 'Νέα Σμύρνη, Αττική', en: 'Nea Smyrni, Attica' },
      indoor: false,
      sports: ['FOOTBALL'],
      imageUrl: null,
      rating: { average: 4.6, count: 58 },
      nextSlotAt: at(0, 20),
      pricePerHourFrom: 20,
    },
    {
      id: 'mock-4',
      name: { el: 'Αθλητικός Όμιλος Γλυφάδας', en: 'Glyfada Sports Club' },
      area: { el: 'Γλυφάδα, Αττική', en: 'Glyfada, Attica' },
      indoor: false,
      sports: ['TENNIS'],
      imageUrl: null,
      rating: { average: 4.9, count: 31 },
      nextSlotAt: at(2, 9),
      pricePerHourFrom: 18,
    },
    {
      id: 'mock-5',
      name: { el: 'Γήπεδο Βόλεϊ Αλίμου', en: 'Alimos Volleyball Court' },
      area: { el: 'Άλιμος, Αττική', en: 'Alimos, Attica' },
      indoor: false,
      sports: ['VOLLEYBALL'],
      imageUrl: null,
      rating: { average: 4.4, count: 9 },
      nextSlotAt: at(1, 17),
      pricePerHourFrom: 15,
    },
    {
      id: 'mock-6',
      name: { el: 'Γήπεδα Τένις Χαλανδρίου', en: 'Chalandri Tennis Courts' },
      area: { el: 'Χαλάνδρι, Αττική', en: 'Chalandri, Attica' },
      indoor: false,
      sports: ['TENNIS', 'BASKETBALL'],
      imageUrl: null,
      rating: { average: 4.3, count: 6 },
      nextSlotAt: at(0, 19),
      pricePerHourFrom: 20,
    },
    {
      id: 'mock-7',
      name: { el: 'Αθλητικό Κέντρο Λάρισας', en: 'Larissa Sports Center' },
      area: { el: 'Λάρισα', en: 'Larissa' },
      indoor: false,
      sports: ['FOOTBALL'],
      imageUrl: null,
      rating: null,
      nextSlotAt: at(3, 18),
      pricePerHourFrom: 14,
    },
    {
      id: 'mock-8',
      name: { el: 'Αθλητικό Κέντρο Πάτρας', en: 'Patras Sports Center' },
      area: { el: 'Πάτρα', en: 'Patras' },
      indoor: true,
      sports: ['FOOTBALL', 'BASKETBALL', 'VOLLEYBALL'],
      imageUrl: null,
      rating: null,
      nextSlotAt: null,
      pricePerHourFrom: null,
    },
  ];
}
