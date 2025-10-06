
'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

// This is now a stable client-side component that acts as a post-login landing page.
// The actual redirection logic is now handled by the AppShell.
export default function HomePage() {
    const router = useRouter();
    const [status, setStatus] = useState("Initializing session...");

    useEffect(() => {
        // The main purpose of this page is to exist as a stable route '/home'
        // for the AppShell to initialize the user session after login.
        // AppShell will then handle the redirection to the correct dashboard.
        
        // We can add a fallback redirect in case the user lands here without a session.
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setStatus("No session found. Redirecting to public home page...");
            router.push('/');
        } else {
            setStatus("Finalizing login, please wait...")
        }

    }, [router]);

    // Render a loading state while the AppShell does its work.
    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">{status}</p>
        </div>
    );
}
