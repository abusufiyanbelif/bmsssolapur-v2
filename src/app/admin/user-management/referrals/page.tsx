
// src/app/admin/user-management/referrals/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ReferralsPageClient } from "./referrals-client";
import { getAllUsers } from "@/services/user-service";

// This is now a pure Server Component for fetching data.
async function ReferralsPageDataLoader() {
  try {
    const allUsers = await getAllUsers();
    const initialReferrals = allUsers.filter(u => u.roles.includes('Referral'));
    
    // The data is now properly serialized by the server action.
    return <ReferralsPageClient initialReferrals={JSON.parse(JSON.stringify(initialReferrals))} />;
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return <ReferralsPageClient initialReferrals={[]} error={error} />;
  }
}

export default function ReferralsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ReferralsPageDataLoader />
        </Suspense>
    )
}
