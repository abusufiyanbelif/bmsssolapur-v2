
'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

// This is a client-side routing component.
export default function HomePage() {
    const router = useRouter();
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        const role = localStorage.getItem('activeRole');
        const userId = localStorage.getItem('userId');

        if (role && userId) {
            setStatus(`Redirecting to ${role} dashboard...`);
            switch (role) {
                case 'Donor':
                    router.push('/donor');
                    break;
                case 'Beneficiary':
                    router.push('/beneficiary');
                    break;
                case 'Referral':
                    router.push('/referral');
                    break;
                case 'Admin':
                case 'Super Admin':
                case 'Finance Admin':
                    router.push('/admin');
                    break;
                default:
                    // If role is unknown, fall back to public home page
                    setStatus("Unknown role. Redirecting to public home...");
                    router.push('/');
                    break;
            }
        } else {
            // No user session, redirect to public home page.
            setStatus("No session found. Redirecting...");
            router.push('/');
        }
    }, [router]);

    // Render a loading state while the redirect is happening.
    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">{status}</p>
        </div>
    );
}
