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
import { ReferralDashboardContent } from "../referral/referral-dashboard-content";
import { getCurrentUser } from "../actions";
import { useLoading } from "@/contexts/loading-context";


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
    const { setIsDataLoading } = useLoading();

    useEffect(() => {
        const initializeSession = async () => {
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
                setIsDataLoading(false); // Signal that all data is ready

            } catch (e) {
                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(`Failed to load dashboard: ${errorMessage}`);
                setIsDataLoading(false);
            } finally {
                setLoading(false);
            }
        };

        initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);


    if (loading) {
        // This will only show briefly, as the main loading is handled by AppShell
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    if (!user || !activeRole || !settings) {
        return null; // Or a more specific error/loading state
    }
    
    // Pass only the relevant data down to each dashboard component
    switch (activeRole) {
        case 'Donor':
            const userDonations = allDonations.filter(d => d.donorId === user.id);
            return <DonorDashboardContent user={user} donations={userDonations} allLeads={allLeads} allDonations={allDonations} allCampaigns={allCampaigns} quotes={quotes} settings={settings} />;
        case 'Beneficiary':
            const userCases = allLeads.filter(l => l.beneficiaryId === user.id);
            return <BeneficiaryDashboardContent cases={userCases} quotes={quotes} settings={settings} />;
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
            return <DashboardClient allDonations={allDonations} allLeads={allLeads} allUsers={allUsers} allCampaigns={allCampaigns} quotes={quotes} />;
        case 'Referral':
             const referredBeneficiaries = allUsers.filter(u => u.referredByUserId === user.id);
             const referredBeneficiaryIds = new Set(referredBeneficiaries.map(u => u.id));
             const referredLeads = allLeads.filter(l => l.beneficiaryId && referredBeneficiaryIds.has(l.beneficiaryId));
            return <ReferralDashboardContent user={user} referredBeneficiaries={referredBeneficiaries} referredLeads={referredLeads} quotes={quotes} />;
        default:
            return <p>No dashboard available for role: {activeRole}</p>;
    }
}
