import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { KeyProvider } from './contexts/KeyProvider';
import { EventsProvider } from './contexts/EventsProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Community Curated Events',
  description: 'A client for managing Nostr events',
  icons: {
    icon: '/icon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 