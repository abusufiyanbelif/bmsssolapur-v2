

'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./public-home-page";
import { Loader2 } from "lucide-react";
import type { Quote } from "@/services/types";
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";
import { useRouter } from 'next/navigation';


const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
    </div>
);

export default function Page() {
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('activeRole');
        const userId = localStorage.getItem('userId');

        if (!role || !userId) {
            setActiveRole('Guest');
        } else {
            setActiveRole(role);
        }
        
        getInspirationalQuotes(3).then(setQuotes);
        setLoading(false);
    }, []);

    useEffect(() => {
        // This effect handles the redirection after the role has been determined.
        if (activeRole && activeRole !== 'Guest') {
            switch (activeRole) {
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
                    // Stay on the public home page if role is unknown
                    break;
            }
        }
    }, [activeRole, router]);

    if (loading || (activeRole && activeRole !== 'Guest')) {
        return <LoadingState />;
    }

    // Only render the PublicHomePage if the role is definitively 'Guest'.
    // Other roles will be caught by the loading state above while they are redirecting.
    if (activeRole === 'Guest') {
        return <PublicHomePage quotes={quotes} />;
    }

    // Fallback loading state
    return <LoadingState />;
}
