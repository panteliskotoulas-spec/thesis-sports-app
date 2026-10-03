import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// Για Server Components: επιστρέφει τον τρέχοντα χρήστη ή null αν δεν είναι συνδεδεμένος.
// Το Better Auth διαβάζει το session cookie μέσα από τα headers του request.
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  const { user } = session;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.image ?? undefined,
    accountType: user.accountType,
    isAdmin: user.isAdmin,
  };
}
