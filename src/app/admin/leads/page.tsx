// src/app/admin/leads/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LeadsPageClient } from "./leads-client";
import { getAllLeads, Lead } from "@/services/lead-service";
import { getAllUsers, User } from "@/services/user-service";
import { getAppSettings } from "@/services/app-settings-service";

async function LeadsPageData() {
    try {
        const [leads, users, settings] = await Promise.all([
            getAllLeads(),
            getAllUsers(),
            getAppSettings(),
        ]);
        
        return <LeadsPageClient 
            initialLeads={leads} 
            initialUsers={users}
            initialSettings={settings}
        />

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return <LeadsPageClient 
            initialLeads={[]}
            initialUsers={[]}
            initialSettings={null}
            error={error}
        />
    }
}


export default function LeadsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <LeadsPageData />
        </Suspense>
    );
}
