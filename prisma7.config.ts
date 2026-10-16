import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Τα migrations θέλουν direct σύνδεση (όχι pooled). Η εφαρμογή
    // συνεχίζει να χρησιμοποιεί το DATABASE_URL (pooled) στο runtime.
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
});
