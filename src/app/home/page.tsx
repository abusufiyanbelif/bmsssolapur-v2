'use client';

import { Loader2 } from "lucide-react";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// This page is a stable entry point for authenticated users.
// The AppShell handles all redirection logic based on user role.
// This component simply provides a loading state while that happens.
export default function HomePage() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // The main redirection logic is now in AppShell.
        // This is a fallback in case a user lands here without a session.
        if (!localStorage.getItem('userId')) {
            router.push('/');
        } else {
            setLoading(false);
        }
    }, [router]);

    return (
      <div className="flex flex-col flex-1 items-center justify-center h-full">
          <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
          <p className="mt-4 text-muted-foreground">Initializing Session...</p>
      </div>
    );
}
