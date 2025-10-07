

'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./public-home-page";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';

const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing session...</p>
    </div>
);

export default function Page() {
    const [isClient, setIsClient] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        setIsClient(true);
        const userId = localStorage.getItem('userId');
        setIsLoggedIn(!!userId);
    }, []);

    if (!isClient) {
        return <LoadingState />;
    }

    if (isLoggedIn) {
        // If logged in, this page is just a loading placeholder.
        // The actual redirection and role-switching is handled by the AppShell.
        return <LoadingState />;
    }

    // If not logged in, show the public home page.
    return (
      <Suspense fallback={<LoadingState />}>
        <PublicHomePage />
      </Suspense>
    );
}
