
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTransferForm } from "./add-transfer-form";
import { getAllLeads } from "@/services/lead-service";
import Link from "next/link";
import { ArrowLeft, Ban } from "lucide-react";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAllUsers } from "@/services/user-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function AddTransferPage() {
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/transfers" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Transfers
            </Link>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Ban className="text-destructive"/>Page Deprecated</CardTitle>
                    <CardDescription>
                       This page is no longer in use. Fund transfers should now be recorded directly from the Lead Details page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <Alert>
                        <AlertTitle>Workflow Change</AlertTitle>
                        <AlertDescription>
                            To improve accuracy and context, please go to the specific lead you want to record a transfer for and use the &quot;Add Transfer&quot; button on that page.
                        </AlertDescription>
                   </Alert>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/admin/leads">Go to All Leads</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
