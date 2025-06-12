'use client';

import { KeyProvider } from './contexts/KeyProvider';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KeyProvider>
      {children}
    </KeyProvider>
  );
} 