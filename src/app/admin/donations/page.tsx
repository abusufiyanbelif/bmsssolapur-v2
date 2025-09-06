// src/app/admin/donations/page.tsx
'use client';
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonationsPageClient } from "./donations-client";


// This is now a Client Component that fetches its own data.
export default function DonationsPage() {
    
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <DonationsPageClient 
                initialDonations={[]}
                initialUsers={[]}
                initialLeads={[]}
                initialCampaigns={[]}
            />
        </Suspense>
    );
}
