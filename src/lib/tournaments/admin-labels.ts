import type { getT } from '@/i18n.server';
import {
  ADMIN_ERROR_KEYS,
  type AdminErrorKey,
  type AdminErrorLabels,
} from './admin';

type Translate = Awaited<ReturnType<typeof getT>>['t'];

export function buildAdminErrorLabels(t: Translate): AdminErrorLabels {
  const labels = {} as AdminErrorLabels;
  for (const key of ADMIN_ERROR_KEYS) {
    labels[key as AdminErrorKey] = t(`admin.errors.${key}`);
  }
  return labels;
}
