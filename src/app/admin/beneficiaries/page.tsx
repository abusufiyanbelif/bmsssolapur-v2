

// src/app/admin/beneficiaries/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BeneficiariesPageClient } from "./beneficiaries-client";
import { getAllUsers, User } from "@/services/user-service";

async function BeneficiariesPageDataLoader() {
  try {
    const allUsers = await getAllUsers();
    // The getAllUsers function now correctly converts timestamps.
    const initialBeneficiaries = allUsers.filter(u => u.roles.includes('Beneficiary'));
    return <BeneficiariesPageClient initialBeneficiaries={initialBeneficiaries} />;
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return <BeneficiariesPageClient initialBeneficiaries={[]} error={error} />;
  }
}

export default function BeneficiariesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <BeneficiariesPageDataLoader />
        </Suspense>
    )
}

    