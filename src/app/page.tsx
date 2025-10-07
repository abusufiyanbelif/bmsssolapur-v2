
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

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        // This effect ensures that on the very first load, we check for a session.
        // If a session exists, we go to the central /home router.
        // If not, we stay here to show the public page.
        const userId = localStorage.getItem('userId');
        if (userId) {
            router.push('/home');
        }
    }, [router]);

    return (
      <Suspense fallback={<LoadingState />}>
        <PublicHomePage />
      </Suspense>
    );
}
