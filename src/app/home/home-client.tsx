// src/app/home/home-client.tsx
'use client';

import { Suspense, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DonorDashboardContent } from "@/app/donor/donor-dashboard-content";
import { BeneficiaryDashboardContent } from "@/app/beneficiary/beneficiary-dashboard-content";
import type { AppSettings, Campaign, Donation, Lead, Quote, User } from "@/services/types";
import { useRouter } from "next/navigation";
import { DashboardClient } from "../admin/dashboard-client";
import { ReferralDashboardPage } from "../referral/page";
import { getCurrentUser } from "../actions";

interface HomeClientProps {
    settings: AppSettings;
    allDonations: Donation[];
    allLeads: Lead[];
    allUsers: User[];
    allCampaigns: Campaign[];
    quotes: Quote[];
}

export function HomeClient({ settings, allDonations, allLeads, allUsers, allCampaigns, quotes }: HomeClientProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeRole, setActiveRole] = useState<string | null>(null);

    useEffect(() => {
        const initializeSession = async () => {
            setLoading(true);
            const storedUserId = localStorage.getItem('userId');
            const storedActiveRole = localStorage.getItem('activeRole');
            
            if (!storedUserId || !storedActiveRole) {
                router.push('/login');
                return;
            }

            try {
                // Fetch only the current user on the client. All other data is passed via props.
                const fetchedUser = await getCurrentUser(storedUserId);

                if (!fetchedUser) {
                    throw new Error("Your session is invalid. Please log in again.");
                }

                setUser(fetchedUser);
                setActiveRole(storedActiveRole);

            } catch (e) {
                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(`Failed to load dashboard: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        initializeSession();
    }, [router]);


    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    if (!user || !activeRole || !settings) {
        return null; // Or a more specific error/loading state
    }
    
    let userSpecificData: any = {};
    if (activeRole === 'Donor') {
        userSpecificData.donations = allDonations.filter(d => d.donorId === user.id);
    } else if (activeRole === 'Beneficiary') {
        userSpecificData.cases = allLeads.filter(l => l.beneficiaryId === user.id);
    }

    switch (activeRole) {
        case 'Donor':
            return <DonorDashboardContent user={user} donations={userSpecificData.donations || []} allLeads={allLeads} allDonations={allDonations} allCampaigns={allCampaigns} quotes={quotes} settings={settings} />;
        case 'Beneficiary':
            return <BeneficiaryDashboardContent cases={userSpecificData.cases || []} quotes={quotes} settings={settings} />;
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
            return <DashboardClient allDonations={allDonations} allLeads={allLeads} allUsers={allUsers} allCampaigns={allCampaigns} quotes={quotes} />;
        case 'Referral':
            return <ReferralDashboardPage />;
        default:
            return <p>No dashboard available for role: {activeRole}</p>;
    }
}
