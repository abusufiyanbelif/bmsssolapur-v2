// src/app/(public)/layout.tsx
'use client';

import { AppShell } from '@/components/app-shell';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout uses AppShell but in a "guest" context.
  // The AppShell handles rendering the header/footer and knows not to
  // perform authenticated redirects for these public routes.
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AppShell>
        {children}
      </AppShell>
    </Suspense>
  );
}
