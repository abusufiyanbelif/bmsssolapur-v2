

import { getLead } from "@/services/lead-service";
import { notFound } from "next/navigation";
import { EditLeadForm } from "./edit-lead-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAllUsers } from "@/services/user-service";

export default async function EditLeadPage({ params }: { params: { id: string } }) {
    const [lead, campaigns, users] = await Promise.all([
        getLead(params.id),
        getAllCampaigns(),
        getAllUsers(),
    ]);

    if (!lead) {
        notFound();
    }
    
    return (
        <div className="flex-1 space-y-4">
             <Link href={`/admin/leads/${params.id}`} className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lead Details
            </Link>
            
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Editing Lead</AlertTitle>
                <AlertDescription>
                   You are editing a lead record. Changes will be logged in the activity feed.
                </AlertDescription>
            </Alert>
            
            <EditLeadForm lead={lead} campaigns={campaigns} users={users} />
        </div>
    );
}

    
