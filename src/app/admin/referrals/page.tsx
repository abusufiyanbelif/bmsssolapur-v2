
// src/app/admin/referrals/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ReferralsPageClient } from "./referrals-client";
import { getAllUsers } from "@/services/user-service";

async function ReferralsPageDataLoader() {
  try {
    const allUsers = await getAllUsers();
    const initialReferrals = allUsers.filter(u => u.roles.includes('Referral'));
    return <ReferralsPageClient initialReferrals={initialReferrals} />;
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
