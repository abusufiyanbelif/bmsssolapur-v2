// src/app/home/page.tsx
'use client';

import { Suspense, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DonorDashboardContent } from "@/app/donor/donor-dashboard-content";
import { BeneficiaryDashboardContent } from "@/app/beneficiary/beneficiary-dashboard-content";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getLeadsByBeneficiaryId, getAllLeads } from "@/services/lead-service";
import { getQuotes, getPublicCampaigns } from "@/app/home/actions";
import { getAppSettings } from "@/app/admin/settings/actions";
import type { AppSettings, Campaign, Donation, Lead, Quote } from "@/services/types";
import { useRouter } from "next/navigation";
import { DashboardClient } from "../admin/dashboard-client";
import { ReferralDashboardPage } from "../referral/page";

function HomePageLoader() {
    const [user, setUser] = useState<User | null>(null);
    const [userSpecificData, setUserSpecificData] = useState<any>(null);
    const [commonData, setCommonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const storedUserId = localStorage.getItem('userId');
            const activeRole = localStorage.getItem('activeRole');
            
            if (!storedUserId || !activeRole) {
                router.push('/login');
                return;
            }

            try {
                const [fetchedUser, fetchedSettings, fetchedQuotes] = await Promise.all([
                    getUser(storedUserId),
                    getAppSettings(),
                    getQuotes(3),
                ]);

                if (!fetchedUser || !fetchedSettings) {
                    setError("Could not load essential user or application data.");
                    setLoading(false);
                    return;
                }
                
                setUser(fetchedUser);

                let specificData: any = {};
                if (activeRole === 'Donor') {
                    specificData.donations = await getDonationsByUserId(storedUserId);
                    specificData.allLeads = await getAllLeads();
                    specificData.allDonations = await getAllDonations();
                    specificData.allCampaigns = await getPublicCampaigns();
                } else if (activeRole === 'Beneficiary') {
                    specificData.cases = await getLeadsByBeneficiaryId(storedUserId);
                } else if (['Admin', 'Super Admin', 'Finance Admin'].includes(activeRole)) {
                    const [donations, users, leads, campaigns] = await Promise.all([
                        getAllDonations(),
                        getAllUsers(),
                        getAllLeads(),
                        getPublicCampaigns(),
                    ]);
                    specificData = { allDonations: donations, allUsers: users, allLeads: leads, allCampaigns: campaigns };
                }

                setUserSpecificData(specificData);
                setCommonData({ quotes: fetchedQuotes, settings: fetchedSettings });

            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(`Failed to load dashboard: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [router]);

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    if (!user) {
        return null;
    }

    switch (user.activeRole) {
        case 'Donor':
            return <DonorDashboardContent user={user} {...userSpecificData} {...commonData} />;
        case 'Beneficiary':
            return <BeneficiaryDashboardContent {...userSpecificData} {...commonData} />;
        case 'Admin':
        case 'Super Admin':
        case 'Finance Admin':
            return <DashboardClient {...userSpecificData} {...commonData} />;
        case 'Referral':
            return <ReferralDashboardPage />;
        default:
            return <p>No dashboard available for role: {user.activeRole}</p>;
    }
}

export default function HomePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <HomePageLoader />
        </Suspense>
    );
}