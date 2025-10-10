// src/app/referral/page.tsx
import { Suspense } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { ReferralDashboardContent } from "./referral-dashboard-content";
import { getUser, getReferredBeneficiaries } from "@/services/user-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { getQuotes } from "@/app/home/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cookies } from 'next/headers'

async function ReferralPageDataLoader() {
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        // This case should ideally be handled by middleware or AppShell redirecting to login.
        return <ReferralDashboardContent user={null} referredBeneficiaries={[]} referredLeads={[]} quotes={[]} error="User not logged in." />;
    }

    try {
        const [user, beneficiaries, quotes] = await Promise.all([
            getUser(userId),
            getReferredBeneficiaries(userId),
            getQuotes(3),
        ]);

        if (!user) {
            throw new Error("Could not find user profile.");
        }

        let leads = [];
        if (beneficiaries.length > 0) {
            const leadPromises = beneficiaries.map(b => getLeadsByBeneficiaryId(b.id!));
            const leadsByBeneficiary = await Promise.all(leadPromises);
            leads = leadsByBeneficiary.flat();
        }

        return <ReferralDashboardContent 
            user={JSON.parse(JSON.stringify(user))} 
            referredBeneficiaries={JSON.parse(JSON.stringify(beneficiaries))} 
            referredLeads={JSON.parse(JSON.stringify(leads))} 
            quotes={JSON.parse(JSON.stringify(quotes))}
        />;

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown server error occurred.";
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }
}

export default function ReferralDashboardPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <ReferralPageDataLoader />
        </Suspense>
    );
}
