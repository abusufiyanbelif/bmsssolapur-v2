
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

// This page is now exclusively for guest users.
// The AppShell handles redirecting logged-in users to /home.
export default function Page() {
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
        // This is a failsafe. The main redirection logic is in AppShell.
        if (localStorage.getItem('userId')) {
            router.push('/home');
        }
    }, [router]);

    if (!isClient) {
        return <LoadingState />;
    }

    return (
      <Suspense fallback={<LoadingState />}>
        <PublicHomePage />
      </Suspense>
    );
}
