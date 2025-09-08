
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, Users, ShieldCheck, PlusCircle, UserCheck, User, Loader2, AlertCircle, Workflow, LockOpen } from "lucide-react";
import { type User as UserType } from "@/services/user-service";
import { LeadConfigForm } from "./lead-config-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ApproversList } from "./approvers-list";
import { useState, useEffect } from "react";
import { AppSettings } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleUpdateLeadConfiguration } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface LeadConfigurationClientProps {
    settings: AppSettings;
    allUsers: UserType[];
}

export function LeadConfigurationClient({ settings: initialSettings, allUsers: initialUsers }: LeadConfigurationClientProps) {
    const { toast } = useToast();
    const router = useRouter();

    const handleConfigUpdate = async (newConfig: Partial<AppSettings['leadConfiguration']>) => {
        const updatedLeadConfig = { ...initialSettings.leadConfiguration, ...newConfig };

        const result = await handleUpdateLeadConfiguration(updatedLeadConfig);
        if (result.success) {
            toast({ variant: 'success', title: 'Setting Updated', description: 'Lead configuration has been saved.' });
            // Instead of re-fetching, we'll just refresh the page server-side props
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
    }
    
    const onApproverUpdate = () => {
        // Simple refresh to get the latest user/group data from the server
        router.refresh();
    }

    const mandatoryApprovers = initialUsers.filter(u => u.groups?.includes('Mandatory Lead Approver'));
    const optionalApprovers = initialUsers.filter(u => u.groups?.includes('Lead Approver') && !u.groups?.includes('Mandatory Lead Approver'));
    
    return (
        <div className="space-y-6">
            <LeadConfigForm 
                settings={initialSettings}
                onUpdate={handleConfigUpdate}
            />
            
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <Workflow />
                           Lead Status Workflow
                        </CardTitle>
                         <CardDescription>
                            Define the allowed transitions between different lead statuses to create a custom workflow.
                        </CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/admin/leads/configuration/workflow">
                           <Settings className="mr-2 h-4 w-4" />
                           Manage Workflow
                        </Link>
                    </Button>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck />
                           Lead Approvers
                        </CardTitle>
                        <CardDescription>
                            Users who can verify and approve new help requests. This is bypassed if approvals are disabled above.
                        </CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/admin/leads/configuration/add-approver">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Approver
                        </Link>
                    </Button>
                </CardHeader>
                 <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserCheck className="h-5 w-5 text-destructive" /> Mandatory Approvers ({mandatoryApprovers.length})</h3>
                        <ApproversList initialApprovers={mandatoryApprovers} group="Mandatory Lead Approver" onUpdate={onApproverUpdate} />
                    </div>
                    <Separator />
                     <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Optional Approvers ({optionalApprovers.length})</h3>
                        <ApproversList initialApprovers={optionalApprovers} group="Lead Approver" onUpdate={onApproverUpdate} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
