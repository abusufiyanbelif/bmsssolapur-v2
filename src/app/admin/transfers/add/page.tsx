
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTransferForm } from "./add-transfer-form";
import { getAllLeads } from "@/services/lead-service";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AddTransferPage() {
    const leads = await getAllLeads();

    // Filter for leads that can receive funds
    const openLeads = leads.filter(lead => 
        (lead.status === 'Ready For Help' || lead.status === 'Publish' || lead.status === 'Partial') && lead.verifiedStatus === 'Verified'
    );

    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/transfers" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Transfers
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle>Record Fund Transfer</CardTitle>
                    <CardDescription>
                        Fill in the form below to record a fund transfer to a beneficiary.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddTransferForm leads={openLeads} />
                </CardContent>
            </Card>
        </div>
    );
}
