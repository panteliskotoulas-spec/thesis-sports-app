import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { signUpExtrasSchema } from '@/lib/validators/auth';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      // Μόνο ο server τα ορίζει.
      isAdmin: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      // Τα επόμενα τρία τα στέλνει ο client στην εγγραφή.
      // Ο έλεγχος γίνεται στο databaseHooks παρακάτω.
      accountType: {
        type: 'string',
        required: false,
        defaultValue: 'INDIVIDUAL',
      },
      businessName: {
        type: 'string',
        required: false,
      },
      taxId: {
        type: 'string',
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const parsed = signUpExtrasSchema.safeParse(user);

          if (!parsed.success) {
            throw new APIError('BAD_REQUEST', {
              message: 'INVALID_ACCOUNT_DATA',
            });
          }

          return { data: { ...user, ...parsed.data } };
        },
      },
      update: {
        before: async (data) => {
          if (
            'accountType' in data ||
            'businessName' in data ||
            'taxId' in data
          ) {
            throw new APIError('BAD_REQUEST', {
              message: 'ACCOUNT_FIELDS_LOCKED',
            });
          }
          return { data };
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
