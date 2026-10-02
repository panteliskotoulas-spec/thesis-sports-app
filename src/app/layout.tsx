import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { commissioner } from '@/lib/fonts';
import './globals.css';
import { TRPCReactProvider } from '@/trpc/client/client';

export const metadata: Metadata = {
  title: 'Sports App',
  description: 'Sports field reservation and team-matching app',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="el"
      suppressHydrationWarning
      className={`h-full antialiased ${commissioner.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
