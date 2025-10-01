

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunicationsForm } from "./communications-form";
import { getAllLeads } from "@/services/lead-service";
import { Megaphone, MessageSquare, ShieldCheck, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CommunicationsPage() {
    const allLeads = await getAllLeads();
    
    // Filter for leads that are verified and open for funding for public appeals
    const openLeadsForAppeal = allLeads.filter(lead => 
        lead.caseVerification === 'Verified' && 
        (lead.caseAction === 'Publish' || lead.caseAction === 'Ready For Help' || lead.caseAction === 'Partial')
    );

    // Filter for leads that are awaiting verification for admin actions
    const pendingVerificationLeads = allLeads.filter(lead => lead.caseVerification === 'Pending');

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Communications Center</h2>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <MessageSquare />
                        Generate Formatted Messages
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Select a message type and provide the necessary information to generate a pre-formatted message for platforms like WhatsApp.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Tabs defaultValue="public-appeal" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="public-appeal"><Megaphone className="mr-2 h-4 w-4" />Public Appeal</TabsTrigger>
                            <TabsTrigger value="admin-action"><ShieldCheck className="mr-2 h-4 w-4" />Admin Action</TabsTrigger>
                            <TabsTrigger value="monthly-update" disabled><Activity className="mr-2 h-4 w-4" />Monthly Update</TabsTrigger>
                        </TabsList>
                        <TabsContent value="public-appeal" className="pt-6">
                            <CommunicationsForm 
                                openLeads={openLeadsForAppeal}
                                formType="public-appeal"
                            />
                        </TabsContent>
                        <TabsContent value="admin-action" className="pt-6">
                             <CommunicationsForm 
                                openLeads={pendingVerificationLeads}
                                formType="admin-action"
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
