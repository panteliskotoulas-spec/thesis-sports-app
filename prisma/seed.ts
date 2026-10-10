import 'dotenv/config';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Sport = 'FOOTBALL' | 'BASKETBALL' | 'VOLLEYBALL' | 'TENNIS';
type SlotStatus = 'OPEN' | 'PENDING_PAYMENT' | 'BOOKED';

type Localized = {
  el: string;
  en: string;
};

interface SeedField {
  id: string;
  name: Localized;
  description: Localized;
  area: Localized;
  address: string;
  latitude: number;
  longitude: number;
  indoor: boolean;
  sports: Sport[];
  pricePerHour: number;
  days: number[];
  hours: number[];
  ratings: number[];
}

interface SlotInput {
  fieldId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  price: number;
  sportType: Sport;
  status: SlotStatus;
  holdExpiresAt?: Date;
}

const OWNER = {
  id: 'seed-owner',
  name: 'Seed Owner',
  email: 'seed-owner@example.com',
};

const REVIEWERS = [
  {
    id: 'seed-reviewer-1',
    name: 'Γιώργος Κωνσταντίνου',
    email: 'seed-reviewer-1@example.com',
  },
  {
    id: 'seed-reviewer-2',
    name: 'Μαρία Παπαδοπούλου',
    email: 'seed-reviewer-2@example.com',
  },
  {
    id: 'seed-reviewer-3',
    name: 'Νίκος Αλεξίου',
    email: 'seed-reviewer-3@example.com',
  },
];

const COMMENTS: (string | null)[] = [
  'Εξαιρετικός χώρος, πολύ καλός φωτισμός.',
  'Καθαρό γήπεδο και εύκολη πρόσβαση.',
  'Καλή τιμή για την ποιότητα που προσφέρει.',
  null,
  'Θα το ξανακλείσουμε σίγουρα με την παρέα.',
];

const FIELDS: SeedField[] = [
  {
    id: 'seed-1',
    name: {
      el: 'Αθλητικό Κέντρο Ηλιούπολης',
      en: 'Ilioupoli Sports Center',
    },
    description: {
      el: 'Υπαίθριο αθλητικό κέντρο με γήπεδο ποδοσφαίρου και μπάσκετ, φωτισμό και αποδυτήρια.',
      en: 'Outdoor sports center with a football and basketball court, floodlights and changing rooms.',
    },
    area: { el: 'Ηλιούπολη, Αττική', en: 'Ilioupoli, Attica' },
    address: 'Λεωφόρος Αθλητισμού 10',
    latitude: 37.93,
    longitude: 23.76,
    indoor: false,
    sports: ['FOOTBALL', 'BASKETBALL'],
    pricePerHour: 15,
    days: [0, 1, 2, 3, 4],
    hours: [18, 19, 20],
    ratings: [5, 5, 4, 5, 4],
  },
  {
    id: 'seed-2',
    name: {
      el: 'Κλειστό Γυμναστήριο Καλαμαριάς',
      en: 'Kalamaria Indoor Gym',
    },
    description: {
      el: 'Κλειστό γυμναστήριο για μπάσκετ και βόλεϊ με ξύλινο δάπεδο και κλιματισμό.',
      en: 'Indoor gym for basketball and volleyball with a wooden floor and air conditioning.',
    },
    area: { el: 'Καλαμαριά, Θεσσαλονίκη', en: 'Kalamaria, Thessaloniki' },
    address: 'Οδός Γυμναστηρίου 5',
    latitude: 40.58,
    longitude: 22.95,
    indoor: true,
    sports: ['BASKETBALL', 'VOLLEYBALL'],
    pricePerHour: 12,
    days: [1, 2, 4, 5],
    hours: [10, 11, 17],
    ratings: [5, 4, 4],
  },
  {
    id: 'seed-3',
    name: { el: 'Γήπεδο 5x5 Νέας Σμύρνης', en: 'Nea Smyrni 5x5 Pitch' },
    description: {
      el: 'Γήπεδο 5x5 με συνθετικό χλοοτάπητα και φωτισμό, ιδανικό για βραδινούς αγώνες.',
      en: '5-a-side pitch with synthetic turf and floodlights, ideal for evening matches.',
    },
    area: { el: 'Νέα Σμύρνη, Αττική', en: 'Nea Smyrni, Attica' },
    address: 'Οδός Ποδοσφαίρου 22',
    latitude: 37.945,
    longitude: 23.713,
    indoor: false,
    sports: ['FOOTBALL'],
    pricePerHour: 20,
    days: [0, 1, 3],
    hours: [20, 21],
    ratings: [5, 4, 5, 4],
  },
  {
    id: 'seed-4',
    name: { el: 'Αθλητικός Όμιλος Γλυφάδας', en: 'Glyfada Sports Club' },
    description: {
      el: 'Όμιλος με γήπεδα τένις σκληρής επιφάνειας και χώρο ξεκούρασης.',
      en: 'Club with hard-surface tennis courts and a rest area.',
    },
    area: { el: 'Γλυφάδα, Αττική', en: 'Glyfada, Attica' },
    address: 'Οδός Ρακέτας 3',
    latitude: 37.865,
    longitude: 23.753,
    indoor: false,
    sports: ['TENNIS'],
    pricePerHour: 18,
    days: [2, 3, 5, 6],
    hours: [9, 10, 18],
    ratings: [5, 5],
  },
  {
    id: 'seed-5',
    name: { el: 'Γήπεδο Βόλεϊ Αλίμου', en: 'Alimos Volleyball Court' },
    description: {
      el: 'Υπαίθριο γήπεδο βόλεϊ με άμμο, κοντά στη θάλασσα.',
      en: 'Outdoor sand volleyball court close to the sea.',
    },
    area: { el: 'Άλιμος, Αττική', en: 'Alimos, Attica' },
    address: 'Παραλιακή Λεωφόρος 40',
    latitude: 37.91,
    longitude: 23.72,
    indoor: false,
    sports: ['VOLLEYBALL'],
    pricePerHour: 10,
    days: [1, 2, 3],
    hours: [17, 18],
    ratings: [4],
  },
  {
    id: 'seed-6',
    name: {
      el: 'Γήπεδο Μπάσκετ Παλαιού Φαλήρου',
      en: 'Palaio Faliro Basketball Court',
    },
    description: {
      el: 'Υπαίθριο γήπεδο μπάσκετ με νέα επιφάνεια και πλαίσια.',
      en: 'Outdoor basketball court with a new surface and hoops.',
    },
    area: { el: 'Παλαιό Φάληρο, Αττική', en: 'Palaio Faliro, Attica' },
    address: 'Οδός Καλαθοσφαίρισης 7',
    latitude: 37.93,
    longitude: 23.695,
    indoor: false,
    sports: ['BASKETBALL'],
    pricePerHour: 8,
    days: [0, 2, 4],
    hours: [19, 20],
    ratings: [],
  },
  {
    id: 'seed-7',
    name: {
      el: 'Κλειστό Κέντρο Τένις Πειραιά',
      en: 'Piraeus Indoor Tennis Center',
    },
    description: {
      el: 'Κλειστά γήπεδα τένις με ελεγχόμενες συνθήκες όλο τον χρόνο.',
      en: 'Indoor tennis courts with controlled conditions all year round.',
    },
    area: { el: 'Πειραιάς, Αττική', en: 'Piraeus, Attica' },
    address: 'Οδός Λιμένος 18',
    latitude: 37.942,
    longitude: 23.647,
    indoor: true,
    sports: ['TENNIS'],
    pricePerHour: 22,
    days: [3, 4, 5],
    hours: [8, 9, 16],
    ratings: [],
  },
  {
    id: 'seed-8',
    name: {
      el: 'Αθλητικό Κέντρο Περιστερίου',
      en: 'Peristeri Sports Center',
    },
    description: {
      el: 'Αθλητικό κέντρο με γήπεδο ποδοσφαίρου και μπάσκετ. Δεν υπάρχουν προς το παρόν διαθέσιμες ώρες.',
      en: 'Sports center with a football and basketball court. No times are available at the moment.',
    },
    area: { el: 'Περιστέρι, Αττική', en: 'Peristeri, Attica' },
    address: 'Οδός Αθλητών 31',
    latitude: 38.015,
    longitude: 23.69,
    indoor: false,
    sports: ['FOOTBALL', 'BASKETBALL'],
    pricePerHour: 14,
    days: [],
    hours: [],
    ratings: [],
  },
];

function slotTime(dayOffset: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function slotInput(
  field: SeedField,
  day: number,
  hour: number,
  sportType: Sport,
  status: SlotStatus = 'OPEN',
  holdExpiresAt?: Date,
): SlotInput {
  return {
    fieldId: field.id,
    date: slotTime(day, 0),
    startTime: slotTime(day, hour),
    endTime: slotTime(day, hour + 1),
    price: field.pricePerHour,
    sportType,
    status,
    ...(holdExpiresAt && { holdExpiresAt }),
  };
}

function buildSlots(field: SeedField, now: Date): SlotInput[] {
  const slots: SlotInput[] = [];

  for (const day of field.days) {
    field.hours.forEach((hour, position) => {
      if (slotTime(day, hour) <= now) return;
      slots.push(
        slotInput(
          field,
          day,
          hour,
          field.sports[position % field.sports.length],
        ),
      );
    });
  }

  if (field.id === 'seed-1') {
    slots.push(
      slotInput(field, 1, 21, 'FOOTBALL', 'BOOKED'),
      slotInput(
        field,
        1,
        22,
        'FOOTBALL',
        'PENDING_PAYMENT',
        new Date(now.getTime() - 10 * 60 * 1000),
      ),
      slotInput(
        field,
        1,
        23,
        'FOOTBALL',
        'PENDING_PAYMENT',
        new Date(now.getTime() + 10 * 60 * 1000),
      ),
    );
  }

  return slots;
}

function listImageFiles(): string[] {
  const directory = join(process.cwd(), 'public', 'images', 'fields');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort();
}

async function main() {
  const now = new Date();
  const imageFiles = listImageFiles();

  await prisma.fieldReview.deleteMany({
    where: { fieldId: { startsWith: 'seed-' } },
  });
  await prisma.availabilitySlot.deleteMany({
    where: { fieldId: { startsWith: 'seed-' } },
  });
  await prisma.fieldImage.deleteMany({
    where: { fieldId: { startsWith: 'seed-' } },
  });
  await prisma.field.deleteMany({ where: { id: { startsWith: 'seed-' } } });

  for (const user of [OWNER, ...REVIEWERS]) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
      },
    });
  }

  let slotCount = 0;
  let reviewCount = 0;

  for (const [index, field] of FIELDS.entries()) {
    await prisma.field.create({
      data: {
        id: field.id,
        ownerId: OWNER.id,
        name: field.name,
        description: field.description,
        area: field.area,
        sports: field.sports,
        address: field.address,
        latitude: field.latitude,
        longitude: field.longitude,
        indoor: field.indoor,
        status: 'APPROVED',
      },
    });

    const imageCount = Math.min(3, imageFiles.length);
    if (imageCount > 0) {
      await prisma.fieldImage.createMany({
        data: Array.from({ length: imageCount }, (_, order) => ({
          fieldId: field.id,
          url: `/images/fields/${imageFiles[(index + order) % imageFiles.length]}`,
          order,
        })),
      });
    }

    const slots = buildSlots(field, now);
    if (slots.length > 0) {
      await prisma.availabilitySlot.createMany({ data: slots });
      slotCount += slots.length;
    }

    if (field.ratings.length > 0) {
      await prisma.fieldReview.createMany({
        data: field.ratings.map((rating, position) => ({
          fieldId: field.id,
          reviewerId: REVIEWERS[position % REVIEWERS.length].id,
          reservationId: `seed-reservation-${field.id}-${position + 1}`,
          rating,
          comment: COMMENTS[position % COMMENTS.length],
          createdAt: new Date(now.getTime() - (position + 1) * 3 * 86_400_000),
        })),
      });
      reviewCount += field.ratings.length;
    }
  }

  console.log(
    `Seed completed: ${FIELDS.length} fields, ${slotCount} slots, ${reviewCount} reviews, ${Math.min(3, imageFiles.length) * FIELDS.length} images.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
