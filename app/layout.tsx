import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '../lib/ClientLayout';

export const metadata: Metadata = {
  title: 'Nostr Events Viewer',
  description: 'A simple Nostr events viewer built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
} 