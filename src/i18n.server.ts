import { createServerI18next } from 'next-i18next/server';
import i18nConfig from './i18n.config';

export const { getT, getResources, generateI18nStaticParams } =
  createServerI18next({
    ...i18nConfig,
    reloadOnPrerender: process.env.NODE_ENV === 'development',
    resourceLoader: async (language, namespace) => {
      if (process.env.NODE_ENV === 'development') {
        const { readFile } = await import('node:fs/promises');
        const { join } = await import('node:path');
        const file = join(
          process.cwd(),
          'public/locales',
          language,
          `${namespace}.json`,
        );
        return JSON.parse(await readFile(file, 'utf8'));
      }
      return import(`../public/locales/${language}/${namespace}.json`);
    },
  });
