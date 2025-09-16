// src/app/admin/leads/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { getAppSettings } from "@/app/admin/settings/actions";
import { LeadsPageClient } from "./leads-client";

// This is now a Server Component that fetches its own data.
export default async function LeadsPage() {
    // Fetch settings on the server as it's small and critical
    const initialSettings = await getAppSettings();

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <LeadsPageClient
                initialLeads={[]}
                initialUsers={[]}
                initialSettings={initialSettings}
            />
        </Suspense>
    );
}
