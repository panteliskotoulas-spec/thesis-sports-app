import 'server-only';

import { createHash } from 'node:crypto';

export const CLOUDINARY_FOLDER = 'sports-app/fields';
export const CLOUDINARY_ALLOWED_FORMATS = 'jpg,png,webp';

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

function readConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary environment variables');
  }

  return { cloudName, apiKey, apiSecret };
}

export function signUploadParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

export function createUploadSignature(): UploadSignature {
  const { cloudName, apiKey, apiSecret } = readConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signUploadParams(
    {
      allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
      folder: CLOUDINARY_FOLDER,
      timestamp,
    },
    apiSecret,
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    folder: CLOUDINARY_FOLDER,
    allowedFormats: CLOUDINARY_ALLOWED_FORMATS,
    signature,
  };
}

export function isOwnImageUrl(url: string): boolean {
  const { cloudName } = readConfig();
  return url.startsWith(
    `https://res.cloudinary.com/${cloudName}/image/upload/`,
  );
}
