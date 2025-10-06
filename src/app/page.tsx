

'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./home/public-home-page";
import { Loader2 } from "lucide-react";
import type { Quote, Lead, Campaign, User, Donation } from "@/services/types";
import { getOpenGeneralLeads, getPublicDashboardData, getQuotes } from "./home/actions";
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
    const [openLeads, setOpenLeads] = useState<Lead[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]); // For campaign stats
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const router = useRouter();

    useEffect(() => {
        const initializeSession = async () => {
            setLoading(true);
            const role = localStorage.getItem('activeRole');
            const userId = localStorage.getItem('userId');

            if (!role || !userId) {
                setActiveRole('Guest');
                // Fetch public data if guest
                try {
                    const [quotesData, leadsData, publicData] = await Promise.all([
                        getQuotes(3),
                        getOpenGeneralLeads(),
                        getPublicDashboardData(),
                    ]);
                    setQuotes(quotesData);
                    setOpenLeads(leadsData);
                    if (publicData && !publicData.error) {
                        const activeAndUpcomingCampaigns = (publicData.campaigns || []).filter(
                            (c: Campaign) => c.status === 'Active' || c.status === 'Upcoming'
                        );
                        setCampaigns(activeAndUpcomingCampaigns);
                        setAllLeads(publicData.leads || []);
                        setAllDonations(publicData.donations || []);
                        setAllUsers(publicData.users || []);
                    }
                } catch (e) {
                    console.error("Failed to fetch public data", e);
                }

            } else {
                setActiveRole(role);
            }
            setLoading(false);
        };
        
        initializeSession();
    }, []);

    useEffect(() => {
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

    if (activeRole === 'Guest') {
        return <PublicHomePage 
            quotes={quotes} 
            initialLeads={openLeads} 
            campaigns={campaigns} 
            allLeads={allLeads}
            allDonations={allDonations}
            allUsers={allUsers}
         />;
    }

    return <LoadingState />;
}

