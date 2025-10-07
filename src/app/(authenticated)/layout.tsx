// src/app/(authenticated)/layout.tsx
'use client';

import { AppShell } from '@/components/app-shell';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout uses the same AppShell, which will now correctly
  // manage authenticated sessions and redirects for all routes within this group.
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AppShell>
        {children}
      </AppShell>
    </Suspense>
  );
}
