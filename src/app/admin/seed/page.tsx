// src/app/admin/seed/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, UserCheck, Quote, Users, HandCoins, RefreshCcw, Building, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { handleSeedAction } from "./actions";

type SeedStatus = 'idle' | 'loading' | 'success' | 'error';
type SeedTask = 'initial' | 'coreTeam' | 'organization' | 'sampleData';
type SeedResult = {
    message: string;
    details?: string[];
};

export default function SeedPage() {
    const [statuses, setStatuses] = useState<Record<SeedTask, SeedStatus>>({
        initial: 'idle',
        coreTeam: 'idle',
        organization: 'idle',
        sampleData: 'idle'
    });
    const [results, setResults] = useState<Record<SeedTask, SeedResult | null>>({
        initial: null,
        coreTeam: null,
        organization: null,
        sampleData: null,
    });

    const handleSeed = async (task: SeedTask) => {
        setStatuses(prev => ({ ...prev, [task]: 'loading' }));
        setResults(prev => ({ ...prev, [task]: null }));

        try {
            const result = await handleSeedAction(task);
            if(result.success && result.data){
                setResults(prev => ({ ...prev, [task]: result.data }));
                setStatuses(prev => ({ ...prev, [task]: 'success' }));
            } else {
                 setResults(prev => ({ ...prev, [task]: { message: 'Seeding Failed', details: [result.error || 'An unknown error occurred.'] } }));
                 setStatuses(prev => ({ ...prev, [task]: 'error' }));
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unexpected error occurred.";
            setResults(prev => ({ ...prev, [task]: { message: 'Seeding Failed', details: [error] } }));
            setStatuses(prev => ({ ...prev, [task]: 'error' }));
        }
    };
    
    const ResultAlert = ({ status, result }: { status: SeedStatus, result: SeedResult | null }) => {
        if (status === 'idle' || status === 'loading') return null;
        const isSuccess = status === 'success';

        return (
            <Alert variant={isSuccess ? 'default' : 'destructive'} className={isSuccess ? "border-green-300 bg-green-50 text-green-800" : ""}>
                {isSuccess ? <CheckCircle className="h-4 w-4 !text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result?.message}</AlertTitle>
                {result?.details && result.details.length > 0 && (
                    <AlertDescription>
                        <ul className="list-disc pl-5 mt-2 text-xs">
                            {result.details.map((detail, i) => <li key={i}>{detail}</li>)}
                        </ul>
                    </AlertDescription>
                )}
            </Alert>
        )
    };

    return (
        <div className="flex-1 space-y-6">
             <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Database Seeding</h2>
             <Card>
                <CardHeader>
                    <CardTitle>Seed Initial Data</CardTitle>
                    <CardDescription>
                       Use these actions to populate your Firestore database with initial data. It's recommended to run the &quot;Initial Users &amp; Quotes&quot; seed first.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Initial Seed */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Initial Users &amp; Quotes</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates the Super Admin user and populates inspirational quotes. Run this first.</p>
                             </div>
                             <Button onClick={() => handleSeed('initial')} disabled={statuses.initial === 'loading'}>
                                {statuses.initial === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Initial Data
                             </Button>
                        </div>
                        <ResultAlert status={statuses.initial} result={results.initial} />
                    </div>

                    {/* Organization Profile */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary" />Organization Profile</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates the public-facing profile for your organization.</p>
                             </div>
                             <Button onClick={() => handleSeed('organization')} disabled={statuses.organization === 'loading'}>
                                {statuses.organization === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Organization
                             </Button>
                        </div>
                        <ResultAlert status={statuses.organization} result={results.organization} />
                    </div>
                    
                     {/* Core Team */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />Core Team Members</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds the accounts for Founders, Co-Founders, and other Admins.</p>
                             </div>
                             <Button onClick={() => handleSeed('coreTeam')} disabled={statuses.coreTeam === 'loading'}>
                                {statuses.coreTeam === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Core Team
                             </Button>
                        </div>
                        <ResultAlert status={statuses.coreTeam} result={results.coreTeam} />
                    </div>

                    {/* Sample Data */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Sample Campaigns &amp; Leads</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates sample campaigns, beneficiaries, leads, and donations for demonstration.</p>
                             </div>
                             <Button onClick={() => handleSeed('sampleData')} disabled={statuses.sampleData === 'loading'}>
                                {statuses.sampleData === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Sample Data
                             </Button>
                        </div>
                        <ResultAlert status={statuses.sampleData} result={results.sampleData} />
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
