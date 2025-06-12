'use client';

import { KeyProvider } from '../app/contexts/KeyProvider';

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