'use client';

import { Suspense, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import type { Lead, Quote, AppSettings } from "@/services/types";
import { BeneficiaryDashboardContent } from './beneficiary-dashboard-content';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAppSettings } from "@/services/app-settings-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { getQuotes } from "@/app/home/actions";

function BeneficiaryPageLoader({ userId }: { userId: string | null }) {
  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You must be logged in to view the Beneficiary Dashboard.</AlertDescription>
      </Alert>
    );
  }

  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          fetchedUser,
          userCases,
          fetchedQuotes,
          fetchedSettings,
        ] = await Promise.all([
          getUser(userId),
          getLeadsByBeneficiaryId(userId),
          getQuotes(3),
          getAppSettings(),
        ]);

        if (!fetchedUser || !fetchedUser.roles.includes('Beneficiary') || !fetchedSettings) {
          setError("You do not have permission to view this page or settings could not be loaded.");
        } else {
          setUser(fetchedUser);
          setCases(userCases);
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  if (!user || !settings) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Failed to load user data.</AlertDescription></Alert>;
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


function BeneficiaryPageWithAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
    setLoading(false);
  }, []);

  if (loading) {
     return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
        <BeneficiaryPageLoader userId={userId} />
    </Suspense>
  )
}

export default function BeneficiaryDashboardPage() {
    return <BeneficiaryPageWithAuth />;
}
