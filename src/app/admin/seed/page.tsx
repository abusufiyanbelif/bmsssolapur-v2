

// src/app/admin/seed/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, UserCheck, Quote, Users, HandCoins, RefreshCcw, Building, FileText } from "lucide-react";
import { seedInitialUsersAndQuotes, seedCoreTeam, seedOrganizationProfile, seedSampleData } from "@/services/seed-service";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type SeedStatus = 'idle' | 'loading' | 'success' | 'error';
type SeedResult = {
    message: string;
    details?: string[];
};

export default function SeedPage() {
    const [initialSeedStatus, setInitialSeedStatus] = useState<SeedStatus>('idle');
    const [initialSeedResult, setInitialSeedResult] = useState<SeedResult | null>(null);

    const [coreTeamStatus, setCoreTeamStatus] = useState<SeedStatus>('idle');
    const [coreTeamResult, setCoreTeamResult] = useState<SeedResult | null>(null);

    const [orgProfileStatus, setOrgProfileStatus] = useState<SeedStatus>('idle');
    const [orgProfileResult, setOrgProfileResult] = useState<SeedResult | null>(null);
    
    const [sampleDataStatus, setSampleDataStatus] = useState<SeedStatus>('idle');
    const [sampleDataResult, setSampleDataResult] = useState<SeedResult | null>(null);

    const handleSeed = async (
        action: () => Promise<SeedResult>,
        setStatus: React.Dispatch<React.SetStateAction<SeedStatus>>,
        setResult: React.Dispatch<React.SetStateAction<SeedResult | null>>
    ) => {
        setStatus('loading');
        setResult(null);
        try {
            const result = await action();
            setResult(result);
            setStatus('success');
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unknown error occurred.";
            setResult({ message: 'Seeding Failed', details: [error] });
            setStatus('error');
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
                       Use these actions to populate your Firestore database with initial data. It&apos;s recommended to run the &quot;Initial Users &amp; Quotes&quot; seed first.
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
                             <Button onClick={() => handleSeed(seedInitialUsersAndQuotes, setInitialSeedStatus, setInitialSeedResult)} disabled={initialSeedStatus === 'loading'}>
                                {initialSeedStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Initial Data
                             </Button>
                        </div>
                        <ResultAlert status={initialSeedStatus} result={initialSeedResult} />
                    </div>

                    {/* Organization Profile */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary" />Organization Profile</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates the public-facing profile for your organization.</p>
                             </div>
                             <Button onClick={() => handleSeed(seedOrganizationProfile, setOrgProfileStatus, setOrgProfileResult)} disabled={orgProfileStatus === 'loading'}>
                                {orgProfileStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Organization
                             </Button>
                        </div>
                        <ResultAlert status={orgProfileStatus} result={orgProfileResult} />
                    </div>
                    
                     {/* Core Team */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />Core Team Members</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds the accounts for Founders, Co-Founders, and other Admins.</p>
                             </div>
                             <Button onClick={() => handleSeed(seedCoreTeam, setCoreTeamStatus, setCoreTeamResult)} disabled={coreTeamStatus === 'loading'}>
                                {coreTeamStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Core Team
                             </Button>
                        </div>
                        <ResultAlert status={coreTeamStatus} result={coreTeamResult} />
                    </div>

                    {/* Sample Data */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Sample Campaigns &amp; Leads</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates sample campaigns, beneficiaries, leads, and donations for demonstration.</p>
                             </div>
                             <Button onClick={() => handleSeed(seedSampleData, setSampleDataStatus, setSampleDataResult)} disabled={sampleDataStatus === 'loading'}>
                                {sampleDataStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Seed Sample Data
                             </Button>
                        </div>
                        <ResultAlert status={sampleDataStatus} result={sampleDataResult} />
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
