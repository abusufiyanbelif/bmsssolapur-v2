
'use client';

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from 'next/navigation';
import { DonorDashboardContent } from '../donor/donor-dashboard-content';
import { BeneficiaryDashboardContent } from '../beneficiary/beneficiary-dashboard-content';
import { ReferralDashboardPage } from '../referral/page';
import { DashboardClient } from '../admin/dashboard-client';
import { PublicHomePage } from './public-home-page';
import { getUser, User } from '@/services/user-service';
import type { Lead, Donation, Campaign, Quote, AppSettings } from '@/services/types';
import { getPublicDashboardData, getQuotes } from "./actions";

// This was the old, flawed component.
// It tried to be a router and data-loader, causing race conditions.
function HomePageContent() {
    const [user, setUser] = useState<User | null>(null);
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [dashboardData, setDashboardData] = useState<{
        donations: Donation[],
        users: User[],
        leads: Lead[],
        campaigns: Campaign[],
        quotes: Quote[],
        settings?: AppSettings,
    } | null>(null);

    useEffect(() => {
        const initialize = async () => {
            const storedUserId = localStorage.getItem('userId');
            const storedRole = localStorage.getItem('activeRole');
            
            if (storedUserId) {
                const fetchedUser = await getUser(storedUserId);
                if (fetchedUser) {
                    setUser(fetchedUser);
                    setActiveRole(storedRole || fetchedUser.roles[0]);
                } else {
                    // User not found, treat as guest
                    setUser(null);
                    setActiveRole('Guest');
                }
            } else {
                setUser(null);
                setActiveRole('Guest');
            }

            // This data fetching logic was inefficient and prone to timeouts.
            const data = await getPublicDashboardData();
            const quotes = await getQuotes(3);
            setDashboardData({ ...data, quotes });
            
            setLoading(false);
        };

        initialize();
    }, []);
    
    // This was the core of the problem. It caused redirects before the session was ready.
    useEffect(() => {
        if (!loading && activeRole) {
            switch(activeRole) {
                case 'Admin':
                case 'Super Admin':
                case 'Finance Admin':
                    router.push('/admin');
                    break;
                case 'Donor':
                    router.push('/donor');
                    break;
                case 'Beneficiary':
                    router.push('/beneficiary');
                    break;
                case 'Referral':
                    router.push('/referral');
                    break;
                default:
                    // This is where it would incorrectly redirect back to the guest page.
                    router.push('/');
                    break;
            }
        }
    }, [loading, activeRole, router]);

    if (loading || !dashboardData) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center h-full">
                <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
                <p className="mt-4 text-muted-foreground">Loading Dashboard...</p>
            </div>
        );
    }
    
    // This part of the code was never even reached due to the redirect logic above.
    return <div>Redirecting...</div>;
}


export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
