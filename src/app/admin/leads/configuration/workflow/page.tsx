'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";
import { getAppSettings } from "@/services/app-settings-service";
import { LeadWorkflowForm } from "./lead-workflow-form";
import { useEffect, useState } from "react";
import type { AppSettings } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LeadWorkflowPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setError(null);
            setLoading(true);
            const fetchedSettings = await getAppSettings();
            setSettings(fetchedSettings);
        } catch (e) {
            setError("Failed to load workflow configuration data.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

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

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Status Workflow</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Workflow />
                        Manage Status Transitions
                    </CardTitle>
                    <CardDescription>
                       For each lead status, check the boxes for all the statuses it is allowed to transition to. This allows you to create a custom workflow for your lead management process.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LeadWorkflowForm settings={settings} onUpdate={fetchData} />
                </CardContent>
            </Card>
        </div>
    );
}
