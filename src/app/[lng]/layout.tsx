import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { lng as routeLanguage } from 'next/root-params';
import { ThemeProvider } from 'next-themes';
import { I18nProvider } from 'next-i18next/client';
import { commissioner } from '@/lib/fonts';
import { getT, getResources, generateI18nStaticParams } from '@/i18n.server';
import i18nConfig from '@/i18n.config';
import { TRPCReactProvider } from '@/trpc/client/client';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Sports App',
  description: 'Sports field reservation and team-matching app',
};

export function generateStaticParams() {
  return generateI18nStaticParams();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await routeLanguage();
  if (!i18nConfig.supportedLngs.includes(language)) notFound();
  const { i18n } = await getT('common');

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={`h-full antialiased ${commissioner.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider language={language} resources={getResources(i18n)}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
