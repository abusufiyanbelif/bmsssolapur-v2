
import { getCampaign } from "@/services/campaign-service";
import { notFound } from "next/navigation";
import { CampaignForm } from "./campaign-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
    const campaign = await getCampaign(params.id);

    if (!campaign) {
        notFound();
    }
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/campaigns" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Campaigns
            </Link>
            
            <CampaignForm campaign={campaign} />
        </div>
    );
}
