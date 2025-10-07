// src/app/page.tsx
'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';

const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
    </div>
);

// This is the public landing page.
// The AppShell handles redirecting logged-in users away from here to /home.
export default function Page() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <LoadingState />;
    }

    return (
      <Suspense fallback={<LoadingState />}>
        <PublicHomePage />
      </Suspense>
    );
}
