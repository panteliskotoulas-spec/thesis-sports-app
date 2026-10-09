import type { I18nConfig } from 'next-i18next/proxy';

const i18nConfig: I18nConfig = {
  supportedLngs: ['el', 'en'],
  fallbackLng: 'el',
  ns: ['common', 'auth', 'fields'],
  defaultNS: 'common',
  persistCookie: false,
};

export default i18nConfig;
