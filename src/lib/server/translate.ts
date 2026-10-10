import 'server-only';

import type { LocalizedText } from '@/lib/i18n-content';

type Lng = keyof LocalizedText;

const ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK_BYTES = 450;
const REQUEST_TIMEOUT_MS = 8000;

const encoder = new TextEncoder();

function byteLength(value: string): number {
  return encoder.encode(value).length;
}

function splitLong(sentence: string): string[] {
  const parts: string[] = [];
  let current = '';

  for (const word of sentence.split(/(\s+)/)) {
    if (byteLength(current + word) > MAX_CHUNK_BYTES && current) {
      parts.push(current);
      current = '';
    }
    if (byteLength(word) > MAX_CHUNK_BYTES) {
      for (const char of Array.from(word)) {
        if (byteLength(current + char) > MAX_CHUNK_BYTES) {
          parts.push(current);
          current = '';
        }
        current += char;
      }
    } else {
      current += word;
    }
  }

  if (current) parts.push(current);
  return parts;
}

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let current = '';

  const pieces = text.split(/(?<=[.!?;·])(\s+)|(\n+)/).filter(Boolean);

  for (const piece of pieces) {
    if (byteLength(piece) > MAX_CHUNK_BYTES) {
      if (current) chunks.push(current);
      current = '';
      chunks.push(...splitLong(piece));
      continue;
    }
    if (byteLength(current + piece) > MAX_CHUNK_BYTES) {
      chunks.push(current);
      current = piece;
    } else {
      current += piece;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(
  chunk: string,
  from: Lng,
  to: Lng,
): Promise<string> {
  if (!chunk.trim()) return chunk;

  const params = new URLSearchParams({
    q: chunk,
    langpair: `${from}|${to}`,
  });
  if (process.env.CONTACT_EMAIL) params.set('de', process.env.CONTACT_EMAIL);

  const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: 'no-store',
  });

  if (!response.ok)
    throw new Error(`MyMemory responded with ${response.status}`);

  const body = (await response.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };

  const translated = body.responseData?.translatedText;
  if (
    Number(body.responseStatus) !== 200 ||
    !translated ||
    translated.toUpperCase().includes('MYMEMORY WARNING')
  ) {
    throw new Error('MyMemory translation failed');
  }

  return translated;
}

export async function translateText(
  text: string,
  from: Lng,
): Promise<string | null> {
  const to: Lng = from === 'el' ? 'en' : 'el';

  try {
    const translated: string[] = [];
    for (const chunk of chunkText(text)) {
      translated.push(await translateChunk(chunk, from, to));
    }
    const result = translated.join('').trim();
    return result || null;
  } catch {
    return null;
  }
}

export async function toLocalized(
  text: string,
  from: Lng,
): Promise<LocalizedText> {
  const translated = await translateText(text, from);

  const fallback = translated ?? text;
  return from === 'el'
    ? { el: text, en: fallback }
    : { el: fallback, en: text };
}
