import { z } from 'zod';

// Επιτρεπτές τιμές. Ίδιες με το enum AccountType του Prisma.
export const ACCOUNT_TYPES = ['INDIVIDUAL', 'BUSINESS'] as const;

// Ελέγχει τα πεδία που προσθέτουμε εμείς πάνω από το Better Auth.
// Το email και ο κωδικός ελέγχονται ήδη από το ίδιο το Better Auth.
export const signUpExtrasSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    accountType: z.enum(ACCOUNT_TYPES).default('INDIVIDUAL'),
    businessName: z.string().trim().max(120).nullish(),
    taxId: z.string().trim().nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.accountType !== 'BUSINESS') return;

    if (!value.businessName || value.businessName.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['businessName'],
        message: 'Business name is required',
      });
    }

    // Ελληνικός ΑΦΜ: 9 ψηφία. Δεν επαληθεύεται η ύπαρξή του (βλ. περιορισμό στη διπλωματική).
    if (!value.taxId || !/^\d{9}$/.test(value.taxId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['taxId'],
        message: 'Tax ID must be 9 digits',
      });
    }
  })
  .transform((value) =>
    value.accountType === 'BUSINESS'
      ? value
      : // Άτομο: τα πεδία επιχείρησης μηδενίζονται, ακόμα κι αν στάλθηκαν χειροκίνητα.
        { ...value, businessName: null, taxId: null },
  );

export type SignUpExtras = z.output<typeof signUpExtrasSchema>;
