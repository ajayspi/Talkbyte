import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalkByte AI — Restaurant Voice Ordering Platform',
  description:
    'Autonomous AI voice phone ordering system for Australian restaurants. Caller rings -> AI answers -> takes order -> sends SMS payment link -> pushes to POS.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f172a] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
