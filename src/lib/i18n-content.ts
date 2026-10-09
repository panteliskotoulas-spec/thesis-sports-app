// Δυναμικό περιεχόμενο που εισάγουν οι χρήστες (π.χ. όνομα και περιοχή γηπέδου)
// αποθηκεύεται ως Json { el, en }. Το στατικό περιεχόμενο μένει στα JSON του i18next.
export type LocalizedText = { el: string; en: string };

type ContentLng = keyof LocalizedText;

const FALLBACK: Record<ContentLng, ContentLng> = { el: 'en', en: 'el' };

export function localized(value: LocalizedText, lng: string): string {
  const key: ContentLng = lng === 'en' ? 'en' : 'el';
  return value[key]?.trim() || value[FALLBACK[key]]?.trim() || '';
}
