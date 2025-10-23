
// src/app/admin/user-management/donors/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonorsPageClient } from "./donors-client";
import { getAllUsers } from "@/services/user-service";

// This is now a pure Server Component for fetching data.
async function DonorsPageDataLoader() {
  try {
    const allUsers = await getAllUsers();
    // The getAllUsers function now correctly converts timestamps.
    const initialDonors = allUsers.filter(u => u.roles.includes('Donor'));
    return <DonorsPageClient initialDonors={JSON.parse(JSON.stringify(initialDonors))} />;
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return <DonorsPageClient initialDonors={[]} error={error} />;
  }
}

export default function DonorsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <DonorsPageDataLoader />
        </Suspense>
    )
}
