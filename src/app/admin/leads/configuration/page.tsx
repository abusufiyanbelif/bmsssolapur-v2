

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
import { AppSettings, UserRole } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { handleUpdateLeadConfiguration } from "./actions";
import { useToast } from "@/hooks/use-toast";


export default function LeadConfigurationPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            if(fetchedUsers) {
                setAllUsers(fetchedUsers);
            } else {
                setError("Failed to load user data for approvers list.");
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
            setError(`Failed to load configuration data: ${errorMessage}`);
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleConfigUpdate = async (newConfig: Partial<AppSettings['leadConfiguration']>) => {
        if (!settings?.leadConfiguration) return;
        const updatedLeadConfig = { ...settings.leadConfiguration, ...newConfig };

        const result = await handleUpdateLeadConfiguration(updatedLeadConfig);
        if (result.success) {
            toast({ variant: 'success', title: 'Setting Updated', description: 'Lead configuration has been saved.' });
            fetchData(); // Refresh all data from server
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (error || !settings) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Page</AlertTitle>
                <AlertDescription>{error || "Could not load settings."}</AlertDescription>
            </Alert>
        );
    }

    const mandatoryApprovers = allUsers.filter(u => u.groups?.includes('Mandatory Lead Approver'));
    const optionalApprovers = allUsers.filter(u => u.groups?.includes('Lead Approver') && !u.groups?.includes('Mandatory Lead Approver'));
    
    return (
        <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Configuration</h2>
            <LeadConfigForm 
                settings={settings}
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
