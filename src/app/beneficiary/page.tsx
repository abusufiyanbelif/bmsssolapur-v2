

'use client';

import { Suspense, useEffect, useState } from "react";
import { DonorDashboardContent } from '../donor/donor-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { getRandomQuotes } from "@/services/quotes-service";
import { getUser, User } from "@/services/user-service";
import type { Lead, Quote, AppSettings } from "@/services/types";
import { BeneficiaryDashboardContent } from './beneficiary-dashboard-content';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAppSettings } from "@/services/app-settings-service";

export default function BeneficiaryDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [cases, setCases] = useState<Lead[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                setError("No user session found. Please log in.");
                setLoading(false);
                return;
            }
            
            try {
                const fetchedUser = await getUser(storedUserId);
                if (!fetchedUser || !fetchedUser.roles.includes('Beneficiary')) {
                    setError("You do not have permission to view this page.");
                    setLoading(false);
                    return;
                }
                setUser(fetchedUser);

                const [beneficiaryCases, randomQuotes, appSettings] = await Promise.all([
                    getLeadsByBeneficiaryId(storedUserId),
                    getRandomQuotes(3),
                    getAppSettings(),
                ]);
                setCases(beneficiaryCases);
                setQuotes(randomQuotes);
                setSettings(appSettings);

            } catch (e) {
                setError("Failed to load dashboard data.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!user || !settings) {
      return null;
  }

  return (
    <div className="flex-1 space-y-6">
       <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Beneficiary Dashboard
            </h2>
            <p className="text-muted-foreground">
              Welcome back, {user.name}. Manage your help requests here.
            </p>
        </div>
      <BeneficiaryDashboardContent cases={cases} quotes={quotes} settings={settings} />
    </div>
  );
}
