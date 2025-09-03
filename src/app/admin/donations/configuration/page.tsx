
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Loader2, AlertCircle } from "lucide-react";
import { AppSettings } from "@/services/types";
import { getAppSettings } from "@/app/admin/settings/actions";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DonationConfigForm } from "./donation-config-form";

export default function DonationConfigurationPage() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchData = async () => {
        try {
            setError(null);
            setLoading(true);
            const fetchedSettings = await getAppSettings();
            setSettings(fetchedSettings);
        } catch(e) {
            setError("Failed to load application settings.");
        } finally {
            setLoading(false);
        }
    };

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
                <AlertTitle>Error Loading Page</AlertTitle>
                <AlertDescription>{error || "Could not load settings."}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Donation Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Donation Settings
                    </CardTitle>
                    <CardDescription>
                        Configure settings related to donation types, purposes, and verification workflows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DonationConfigForm settings={settings.donationConfiguration} onUpdate={fetchData} />
                </CardContent>
            </Card>
        </div>
    );
}
