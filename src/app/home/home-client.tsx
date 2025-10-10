
'use client';

import { Suspense, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DonorDashboardContent } from "@/app/donor/donor-dashboard-content";
import { BeneficiaryDashboardContent } from "@/app/beneficiary/beneficiary-dashboard-content";
import { getDonationsByUserId } from "@/services/donation-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import type { AppSettings, Campaign, Donation, Lead, Quote } from "@/services/types";
import { useRouter } from "next/navigation";
import { DashboardClient } from "../admin/dashboard-client";
import { ReferralDashboardPage } from "../referral/page";

interface HomeClientProps {
    settings: AppSettings;
    quotes: Quote[];
    allDonations: Donation[];
    allLeads: Lead[];
    allUsers: User[];
    allCampaigns: Campaign[];
}

export function HomeClient({ settings, quotes, allDonations, allLeads, allUsers, allCampaigns }: HomeClientProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userSpecificData, setUserSpecificData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeRole, setActiveRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const storedUserId = localStorage.getItem('userId');
            const storedActiveRole = localStorage.getItem('activeRole');
            
            if (!storedUserId || !storedActiveRole) {
                router.push('/login');
                return;
            }
            
            setActiveRole(storedActiveRole);

            try {
                const fetchedUser = allUsers.find(u => u.id === storedUserId);

                if (!fetchedUser) {
                    setError("Could not load your user data. Please try logging in again.");
                    setLoading(false);
                    return;
                }
                
                setUser(fetchedUser);

                let specificData: any = {};
                if (storedActiveRole === 'Donor') {
                    specificData.donations = allDonations.filter(d => d.donorId === storedUserId);
                } else if (storedActiveRole === 'Beneficiary') {
                    specificData.cases = allLeads.filter(l => l.beneficiaryId === storedUserId);
                }
                // Admin data is already all loaded
                setUserSpecificData(specificData);

            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(`Failed to load dashboard: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [router, allDonations, allLeads, allUsers]);

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    if (!user || !activeRole) {
        return null;
    }
    
    // Pass the already-fetched common data down
    const commonData = { quotes, settings, allLeads, allDonations, allCampaigns };

    switch (activeRole) {
        case 'Donor':
            return <DonorDashboardContent user={user} {...userSpecificData} {...commonData} />;
        case 'Beneficiary':
            return <BeneficiaryDashboardContent {...userSpecificData} {...commonData} />;
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
            return <DashboardClient allDonations={allDonations} allUsers={allUsers} allLeads={allLeads} allCampaigns={allCampaigns} quotes={quotes} />;
        case 'Referral':
            return <ReferralDashboardPage />;
        default:
            return <p>No dashboard available for role: {activeRole}</p>;
    }
}
