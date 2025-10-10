
// src/app/admin/transfers/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getAllLeads } from "@/services/lead-service";
import { AllTransfersPageClient } from "./transfers-client";
import type { EnrichedTransfer } from "./transfers-client";

// This is now a Server Component responsible for data fetching.
async function TransfersPageDataLoader() {
    const leads = await getAllLeads();
    const initialTransfers: EnrichedTransfer[] = [];
    
    leads.forEach(lead => {
        if (lead.fundTransfers && lead.fundTransfers.length > 0) {
            lead.fundTransfers.forEach((transfer, index) => {
                initialTransfers.push({
                    ...transfer,
                    leadId: lead.id!,
                    leadName: lead.name,
                    beneficiaryId: lead.beneficiaryId,
                    uniqueId: `${lead.id!}_${index}`
                });
            });
        }
    });

    return (
        <AllTransfersPageClient 
            initialTransfers={JSON.parse(JSON.stringify(initialTransfers))}
        />
    );
}

export default function AllTransfersPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <TransfersPageDataLoader />
        </Suspense>
    );
}
