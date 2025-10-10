// src/app/beneficiary/page.tsx
'use client';

import { Suspense, useEffect, useState } from "react";
import { BeneficiaryDashboardContent } from './beneficiary-dashboard-content';
import { Loader2, AlertCircle } from "lucide-react";
import { getUser, User } from "@/services/user-service";
import type { Lead, Quote, AppSettings } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAppSettings } from "@/services/app-settings-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { getQuotes } from "@/app/home/actions";
import { cookies } from 'next/headers';

async function BeneficiaryPageDataLoader() {
    const cookieStore = cookies();
    // This is a placeholder; in a real app, you'd get the user ID securely
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>You must be logged in to view this page.</AlertDescription>
            </Alert>
        );
    }
    
    try {
        const [
            user,
            cases,
            quotes,
            settings
        ] = await Promise.all([
            getUser(userId),
            getLeadsByBeneficiaryId(userId),
            getQuotes(3),
            getAppSettings()
        ]);
        
        if (!user || !settings) {
            throw new Error("Could not load user or settings data.");
        }

        return <BeneficiaryDashboardContent 
            cases={JSON.parse(JSON.stringify(cases))} 
            quotes={JSON.parse(JSON.stringify(quotes))} 
            settings={JSON.parse(JSON.stringify(settings))} 
        />;

    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }
}

export default function BeneficiaryDashboardPage() {
    return (
        <div className="flex-1 space-y-6">
           <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                    Beneficiary Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Manage your help requests here.
                </p>
            </div>
            <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
                <BeneficiaryPageDataLoader />
            </Suspense>
        </div>
    );
}
