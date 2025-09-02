
'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./public-home-page";
import { Loader2 } from "lucide-react";
import { getUser } from "@/services/user-service";
import { useRouter } from 'next/navigation';
import { getInspirationalQuotes } from "@/ai/flows/get-inspirational-quotes-flow";
import type { Quote } from "@/services/types";

// Dynamically import dashboards to avoid bundling everything on every page
const DonorDashboardPage = () => import('@/app/donor/page').then(mod => mod.default);
const BeneficiaryDashboardPage = () => import('@/app/beneficiary/page').then(mod => mod.default);
const ReferralDashboardPage = () => import('@/app/referral/page').then(mod => mod.default);
const AdminDashboardPage = () => import('@/app/admin/page').then(mod => mod.default);


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
            return <Suspense fallback={<LoadingState/>}><DonorDashboardPage /></Suspense>;
        case 'Beneficiary':
            return <Suspense fallback={<LoadingState/>}><BeneficiaryDashboardPage /></Suspense>;
        case 'Referral':
            return <Suspense fallback={<LoadingState/>}><ReferralDashboardPage /></Suspense>;
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
            // The AdminDashboard is a Server Component, so it's handled by Next's routing.
            // We can redirect to it.
             router.push('/admin');
             return <LoadingState />; // Show loader while redirecting
        case 'Guest':
        default:
            return <PublicHomePage quotes={quotes} />;
    }
}
