

'use client';

import { Suspense, useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHomePage } from "./public-home-page";
import { getAllDonations } from "@/services/donation-service";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { PublicDashboardCards } from "./public-dashboard-cards";
import { DonorDashboardContent } from "../donor/donor-dashboard-content";
import { Loader2 } from "lucide-react";
import { getUser } from "@/services/user-service";
import { BeneficiaryDashboardContent } from "../beneficiary/beneficiary-dashboard-content";
import ReferralDashboardPage from "../referral/page";
import AdminDashboardPage from "../admin/page";
import { useRouter } from 'next/navigation';


const CardSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-10 w-full" />
        </CardContent>
    </Card>
);

const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
    </div>
);

export default function Page() {
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem('activeRole');
        const userId = localStorage.getItem('userId');

        if (!role || !userId) {
            setActiveRole('Guest');
        } else {
            setActiveRole(role);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <LoadingState />;
    }
    
    // Based on the role, render the correct dashboard component.
    // The components themselves will handle their data fetching.
    switch (activeRole) {
        case 'Donor':
            return <DonorDashboardContent />;
        case 'Beneficiary':
            return <BeneficiaryDashboardPage />; // This component will fetch its own data
        case 'Referral':
            return <ReferralDashboardPage />; // This component will fetch its own data
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
            return <AdminDashboardPage />; // This component will fetch its own data
        case 'Guest':
        default:
            return <PublicHomePage />;
    }
}


// These are now client components that fetch their own data
function BeneficiaryDashboardPage() {
    return <BeneficiaryDashboardContent />;
}
