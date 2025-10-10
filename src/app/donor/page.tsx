
// src/app/donor/page.tsx
'use client';

import { Suspense, useEffect, useState } from "react";
import { DonorDashboardContent } from './donor-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import { getDonationsByUserId, getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAppSettings } from "@/app/admin/settings/actions";
import { getAllPublicCampaigns } from "@/app/home/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getQuotes } from "@/app/home/actions";
import type { AppSettings, Donation, Lead, Campaign, Quote } from "@/services/types";

function DonorPageLoader() {
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [allLeads, setAllLeads] = useState<Lead[]>([]);
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            setError("You must be logged in to view the Donor Dashboard.");
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                const [
                    fetchedUser,
                    userDonations,
                    fetchedAllLeads,
                    fetchedAllDonations,
                    fetchedAllCampaigns,
                    fetchedQuotes,
                    fetchedSettings,
                ] = await Promise.all([
                    getUser(userId),
                    getDonationsByUserId(userId),
                    getAllLeads(),
                    getAllDonations(),
                    getAllPublicCampaigns(), // Use public campaigns
                    getQuotes(3),
                    getAppSettings(),
                ]);

                if (!fetchedUser || !fetchedUser.roles.includes('Donor') || !fetchedSettings) {
                    setError("You do not have permission to view this page or settings could not be loaded.");
                } else {
                    setUser(fetchedUser);
                    setDonations(userDonations);
                    setAllLeads(fetchedAllLeads);
                    setAllDonations(fetchedAllDonations);
                    setAllCampaigns(fetchedAllCampaigns as Campaign[]);
                    setQuotes(fetchedQuotes);
                    setSettings(fetchedSettings);
                }
            } catch (e) {
                setError("An error occurred while fetching dashboard data.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

    }, [userId]);

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }
    
    if (error) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (!user || !settings) return null;

    return <DonorDashboardContent user={user} donations={donations} allLeads={allLeads} allDonations={allDonations} allCampaigns={allCampaigns} quotes={quotes} settings={settings} />
}

export default function DonorDashboardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <DonorPageLoader />
        </Suspense>
    );
}
