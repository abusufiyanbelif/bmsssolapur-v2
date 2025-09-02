

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

    if (loading) {
        return <LoadingState />;
    }
    
    // Based on the role, render the correct dashboard component.
    // The components themselves will handle their data fetching.
    switch (activeRole) {
        case 'Donor':
             router.push('/donor');
             return <LoadingState />;
        case 'Beneficiary':
             router.push('/beneficiary');
             return <LoadingState />;
        case 'Referral':
             router.push('/referral');
             return <LoadingState />;
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
             router.push('/admin');
             return <LoadingState />;
        case 'Guest':
        default:
            return <PublicHomePage quotes={quotes} />;
    }
}
