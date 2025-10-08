// src/app/admin/donors/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { DonorsPageClient } from "./donors-client";
import { getAllUsersAction } from "@/app/admin/user-management/actions";

// This is now a Server Component
async function DonorsPageDataLoader() {
  try {
    // Fetch data on the server using a server action
    const allUsers = await getAllUsersAction();
    const initialDonors = allUsers.filter(u => u.roles.includes('Donor'));
    
    // Pass serializable data as props to the Client Component
    return <DonorsPageClient initialDonors={initialDonors} />;
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
