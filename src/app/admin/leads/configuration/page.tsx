
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, ShieldCheck, PlusCircle, UserCheck, User, Loader2, AlertCircle, Workflow, LockOpen } from "lucide-react";
import { getAppSettings } from "@/services/app-settings-service";
import { getAllUsers, type User as UserType } from "@/services/user-service";
import { LeadConfigForm } from "./lead-config-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ApproversList } from "./approvers-list";
import { useState, useEffect } from "react";
import { AppSettings } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { handleUpdateLeadConfiguration } from "./actions";
import { useToast } from "@/hooks/use-toast";


const allPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'Other'];

export default function LeadConfigurationPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setError(null);
            setLoading(true);
            const [fetchedSettings, fetchedUsers] = await Promise.all([
                getAppSettings(),
                getAllUsers(),
            ]);
            setSettings(fetchedSettings);
            setAllUsers(fetchedUsers);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
            setError(`Failed to load configuration data. Error: ${errorMessage}`);
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprovalToggle = async (enabled: boolean) => {
        setIsSaving(true);
        const result = await handleUpdateLeadConfiguration(settings?.leadConfiguration?.disabledPurposes || [], enabled);
        if (result.success) {
            toast({ variant: 'success', title: 'Setting Updated', description: 'Approval process setting has been saved.' });
            fetchData();
        } else {
             toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
        setIsSaving(false);
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (error || !settings) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "Could not load settings."}</AlertDescription>
            </Alert>
        );
    }

    const mandatoryApprovers = allUsers.filter(u => u.groups?.includes('Mandatory Lead Approver'));
    const optionalApprovers = allUsers.filter(u => u.groups?.includes('Lead Approver') && !u.groups?.includes('Mandatory Lead Approver'));
    const approvalProcessDisabled = settings.leadConfiguration?.approvalProcessDisabled || false;
    
    return (
        <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Lead Settings
                    </CardTitle>
                    <CardDescription>
                        Configure settings related to lead management, such as enabling or disabling specific purposes and managing who can approve leads.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LeadConfigForm 
                        allPurposes={allPurposes} 
                        disabledPurposes={settings.leadConfiguration?.disabledPurposes || []} 
                        approvalProcessDisabled={approvalProcessDisabled}
                    />
                </CardContent>
            </Card>
            
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
                            Users who can verify and approve new help requests.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                           <Switch
                                id="approval-disable-switch"
                                checked={approvalProcessDisabled}
                                onCheckedChange={handleApprovalToggle}
                                disabled={isSaving}
                            />
                            <Label htmlFor="approval-disable-switch" className={approvalProcessDisabled ? "text-destructive" : ""}>Disable Approvals</Label>
                        </div>
                        <Button asChild>
                            <Link href="/admin/leads/configuration/add-approver">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Approver
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                 <CardContent className="space-y-6">
                    {approvalProcessDisabled && (
                         <Alert variant="destructive">
                            <LockOpen className="h-4 w-4" />
                            <AlertTitle>Approval Process is Disabled</AlertTitle>
                            <AlertDescription>
                                All new leads will be auto-verified and ready for help. Only users with the Founder, Co-Founder, or Finance role can create leads.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserCheck className="h-5 w-5 text-destructive" /> Mandatory Approvers ({mandatoryApprovers.length})</h3>
                        <ApproversList initialApprovers={mandatoryApprovers} group="Mandatory Lead Approver" onUpdate={fetchData} />
                    </div>
                    <Separator />
                     <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Optional Approvers ({optionalApprovers.length})</h3>
                        <ApproversList initialApprovers={optionalApprovers} group="Lead Approver" onUpdate={fetchData} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
