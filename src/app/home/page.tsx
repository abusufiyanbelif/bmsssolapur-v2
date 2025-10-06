
'use client';

import { Suspense, useEffect, useState } from "react";
import { PublicHomePage } from "./public-home-page";
import { Loader2 } from "lucide-react";
import type { Quote, Lead, Campaign, User } from "@/services/types";
import { getInspirationalQuotes, getOpenGeneralLeads, getPublicDashboardData } from "./home/actions";
import { useRouter } from 'next/navigation';
import { getAllCampaigns } from "@/services/campaign-service";
import { getAllLeads } from "@/services/lead-service";


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
                const [quotesData, leadsData, publicData] = await Promise.all([
                    getQuotes(3),
                    getOpenGeneralLeads(),
                    getPublicDashboardData(),
                ]);
                setQuotes(quotesData);
                setOpenLeads(leadsData);
                if (publicData && !publicData.error) {
                    const activeAndUpcomingCampaigns = (publicData.campaigns || []).filter(
                        c => c.status === 'Active' || c.status === 'Upcoming'
                    );
                    setCampaigns(activeAndUpcomingCampaigns);
                    setAllLeads(publicData.leads || []);
                    setAllDonations(publicData.donations || []);
                    setAllUsers(publicData.users || []);
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
