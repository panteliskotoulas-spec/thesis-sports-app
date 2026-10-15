import { createTRPCClient, httpBatchLink, TRPCClientError } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import { authClient } from '@/lib/auth-client';
import type {
  ChangePasswordInput,
  ChangePasswordResult,
  CreditHistoryInput,
  CreditHistoryResult,
  DeleteAccountInput,
  DeleteAccountResult,
  DeletionStatusResult,
  ProfileActionResult,
  UploadAvatarResult,
} from '@/lib/profile/profile';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
    }),
  ],
});

interface CloudinaryUploadResponse {
  secure_url?: string;
}

function errorCode(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    return (error.data as { code?: string } | null | undefined)?.code ?? null;
  }
  return null;
}

export async function updateProfileName(
  name: string,
): Promise<ProfileActionResult> {
  try {
    const { error } = await authClient.updateUser({ name });
    return error ? { status: 'error' } : { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

export async function updateProfileImage(
  image: string | null,
): Promise<ProfileActionResult> {
  try {
    const { error } = await authClient.updateUser({ image });
    return error ? { status: 'error' } : { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  try {
    const { error } = await authClient.changePassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: input.revokeOtherSessions,
    });

    if (!error) return { status: 'ok' };
    if (error.code === 'INVALID_PASSWORD') return { status: 'wrongPassword' };
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export async function uploadAvatar(file: File): Promise<UploadAvatarResult> {
  try {
    const signature = await client.profile.uploadAvatarSignature.mutate();

    const body = new FormData();
    body.append('file', file);
    body.append('api_key', signature.apiKey);
    body.append('timestamp', String(signature.timestamp));
    body.append('folder', signature.folder);
    body.append('allowed_formats', signature.allowedFormats);
    body.append('signature', signature.signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      { method: 'POST', body },
    );
    if (!response.ok) return { status: 'error' };

    const result = (await response.json()) as CloudinaryUploadResponse;
    if (!result.secure_url) return { status: 'error' };

    return { status: 'ok', url: result.secure_url };
  } catch {
    return { status: 'error' };
  }
}

export async function fetchCreditHistory(
  input: CreditHistoryInput,
): Promise<CreditHistoryResult> {
  try {
    return await client.profile.creditHistory.query(input);
  } catch {
    return { status: 'error' };
  }
}

export async function fetchDeletionStatus(): Promise<DeletionStatusResult> {
  try {
    return await client.profile.deletionStatus.query();
  } catch {
    return { status: 'error' };
  }
}

export async function deleteAccount(
  input: DeleteAccountInput,
): Promise<DeleteAccountResult> {
  try {
    await client.profile.deleteAccount.mutate(input);
    return { status: 'ok' };
  } catch (error) {
    const code = errorCode(error);
    if (code === 'FORBIDDEN') return { status: 'wrongPassword' };
    if (code === 'CONFLICT') return { status: 'blocked' };
    if (code === 'UNAUTHORIZED') return { status: 'unauthorized' };
    return { status: 'error' };
  }
}
