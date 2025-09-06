// src/app/admin/leads/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { getAppSettings } from "@/app/admin/settings/actions";
import { LeadsPageClient } from "./leads-client";

// This is now a Server Component responsible for data fetching.
export default function LeadsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <LeadsPageDataLoader />
        </Suspense>
    );
}

async function LeadsPageDataLoader() {
  try {
    const [initialLeads, initialUsers, initialSettings] = await Promise.all([
      getAllLeads(),
      getAllUsers(),
      getAppSettings(),
    ]);

    return (
      <LeadsPageClient
        initialLeads={initialLeads}
        initialUsers={initialUsers}
        initialSettings={initialSettings}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return (
      <LeadsPageClient
        initialLeads={[]}
        initialUsers={[]}
        initialSettings={null}
        error={errorMessage}
      />
    );
  }
}
