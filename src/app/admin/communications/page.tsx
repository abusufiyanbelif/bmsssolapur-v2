
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunicationsForm } from "./communications-form";
import { getAllLeads } from "@/services/lead-service";
import { Megaphone, MessageSquare } from "lucide-react";

export default async function CommunicationsPage() {
    // Fetch only leads that are verified and open for funding
    const allLeads = await getAllLeads();
    const openLeads = allLeads.filter(lead => 
        lead.verifiedStatus === 'Verified' && 
        (lead.caseAction === 'Publish' || lead.caseAction === 'Ready For Help' || lead.caseAction === 'Partial')
    );

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Communications Center</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare />
                        Generate Public Messages
                    </CardTitle>
                    <CardDescription>
                        Select a message type and provide the necessary information to generate a pre-formatted message for platforms like WhatsApp.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CommunicationsForm openLeads={openLeads} />
                </CardContent>
            </Card>
        </div>
    );
}
