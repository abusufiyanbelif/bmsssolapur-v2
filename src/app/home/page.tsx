
'use client';

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';

const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing Session...</p>
    </div>
);

// This page is now exclusively for routing authenticated users.
// The AppShell handles redirecting to the correct dashboard. This page
// simply provides a stable entry point after login.
function HomePageContent() {
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
        // The main redirection logic is now in AppShell.
        // This is just a fallback in case a user lands here without a session.
        if (!localStorage.getItem('userId')) {
            router.push('/');
        }
    }, [router]);

    if (!isClient) {
        return <LoadingState />;
    }

    return (
      <LoadingState />
    );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomePageContent />
    </Suspense>
  );
}
