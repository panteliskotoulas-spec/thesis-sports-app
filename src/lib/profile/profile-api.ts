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

export const uploadAvatar: (
  file: File,
) => Promise<UploadAvatarResult> = async () => ({ status: 'error' });

export const fetchCreditHistory: (
  input: CreditHistoryInput,
) => Promise<CreditHistoryResult> = async () => ({ status: 'error' });

export const fetchDeletionStatus: () => Promise<DeletionStatusResult> =
  async () => ({ status: 'error' });

export const deleteAccount: (
  input: DeleteAccountInput,
) => Promise<DeleteAccountResult> = async () => ({ status: 'error' });
