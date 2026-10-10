import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/server/routers/_app';
import type {
  GeocodeResult,
  ImageItem,
  NewFieldValues,
} from '@/lib/fields/new-field';

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: '/api/trpc', transformer: superjson })],
});

interface CloudinaryUploadResponse {
  secure_url?: string;
}

export async function geocodeAddress(
  query: string,
  lng: string,
): Promise<GeocodeResult[]> {
  return client.fieldSubmission.geocode.mutate({
    query,
    lng: lng === 'en' ? 'en' : 'el',
  });
}

async function uploadImage(
  file: File,
  signature: Awaited<
    ReturnType<typeof client.fieldSubmission.uploadSignature.mutate>
  >,
): Promise<string> {
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

  if (!response.ok) throw new Error('Image upload failed');

  const result = (await response.json()) as CloudinaryUploadResponse;
  if (!result.secure_url) throw new Error('Image upload failed');

  return result.secure_url;
}

async function resolveImages(items: ImageItem[]): Promise<string[]> {
  const files = items.flatMap((item) =>
    item.kind === 'new' ? [item.file] : [],
  );

  if (files.length === 0) {
    return items.flatMap((item) =>
      item.kind === 'existing' ? [item.url] : [],
    );
  }

  const signature = await client.fieldSubmission.uploadSignature.mutate();
  const uploaded = await Promise.all(
    files.map((file) => uploadImage(file, signature)),
  );

  let next = 0;
  return items.map((item) =>
    item.kind === 'existing' ? item.url : uploaded[next++],
  );
}

function toPayload(values: NewFieldValues, images: string[], lng: string) {
  return {
    lng: lng === 'en' ? ('en' as const) : ('el' as const),
    name: values.name,
    description: values.description,
    area: values.area,
    address: values.address,
    latitude: values.latitude,
    longitude: values.longitude,
    indoor: values.indoor,
    sports: values.sports,
    images,
  };
}

export async function submitNewField(
  values: NewFieldValues,
  lng: string,
): Promise<{ id: string }> {
  const images = await resolveImages(values.images);
  return client.fieldSubmission.create.mutate(toPayload(values, images, lng));
}

export async function updateExistingField(
  id: string,
  values: NewFieldValues,
  lng: string,
): Promise<{ id: string }> {
  const images = await resolveImages(values.images);
  return client.fieldOwner.update.mutate({
    id,
    ...toPayload(values, images, lng),
  });
}
