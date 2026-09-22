import type { Metadata } from 'next';
import { Fraunces, Geist_Mono } from 'next/font/google';
import { CookieConsent } from '@/components/ui/CookieConsent';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TalkByte AI — Voice AI that answers, books and gets paid',
  description:
    'TalkByte answers every call in under a second, handles the request, takes payment, and syncs it to your systems. Voice infrastructure for clinics, trades, hospitality, retail and multi-site operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
