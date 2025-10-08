// src/app/admin/seed/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, UserCheck, Quote, Users, HandCoins, RefreshCcw, Building, FileText, Trash2, CreditCard, Settings, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { handleSeedAction, handleEraseAction } from "./actions";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type SeedStatus = 'idle' | 'loading' | 'success' | 'error';
type SeedTask = 'initial' | 'coreTeam' | 'organization' | 'paymentGateways' | 'sampleData' | 'appSettings' | 'syncFirebaseAuth';
type SeedResult = {
    message: string;
    details?: string[];
};

export default function SeedPage() {
    const router = useRouter();
    const [statuses, setStatuses] = useState<Record<SeedTask, SeedStatus>>({
        initial: 'idle',
        coreTeam: 'idle',
        organization: 'idle',
        appSettings: 'idle',
        paymentGateways: 'idle',
        sampleData: 'idle',
        syncFirebaseAuth: 'idle'
    });
    const [eraseStatuses, setEraseStatuses] = useState<Record<SeedTask, SeedStatus>>({
        initial: 'idle',
        coreTeam: 'idle',
        organization: 'idle',
        appSettings: 'idle',
        paymentGateways: 'idle',
        sampleData: 'idle',
        syncFirebaseAuth: 'idle',
    });
    const [results, setResults] = useState<Record<SeedTask, SeedResult | null>>({
        initial: null,
        coreTeam: null,
        organization: null,
        appSettings: null,
        paymentGateways: null,
        sampleData: null,
        syncFirebaseAuth: null,
    });

    const handleSeed = async (task: SeedTask) => {
        setStatuses(prev => ({ ...prev, [task]: 'loading' }));
        setEraseStatuses(prev => ({ ...prev, [task]: 'idle' })); // Reset erase status
        setResults(prev => ({ ...prev, [task]: null }));

        try {
            const result = await handleSeedAction(task);
            if(result.success && result.data){
                setResults(prev => ({ ...prev, [task]: result.data }));
                setStatuses(prev => ({ ...prev, [task]: 'success' }));
                if (task === 'organization') router.refresh(); // Refresh on org change
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
    
    const handleErase = async (task: SeedTask) => {
        setEraseStatuses(prev => ({ ...prev, [task]: 'loading' }));
        setStatuses(prev => ({ ...prev, [task]: 'idle' })); // Reset seed status
        setResults(prev => ({ ...prev, [task]: null }));

        try {
            const result = await handleEraseAction(task);
            if (result.success && result.data) {
                setResults(prev => ({ ...prev, [task]: result.data }));
                setEraseStatuses(prev => ({ ...prev, [task]: 'success' }));
                if (task === 'organization' || task === 'appSettings') router.refresh();
            } else {
                setResults(prev => ({ ...prev, [task]: { message: 'Erase Failed', details: [result.error || 'An unknown error occurred.'] } }));
                setEraseStatuses(prev => ({ ...prev, [task]: 'error' }));
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unexpected error occurred.";
            setResults(prev => ({ ...prev, [task]: { message: 'Erase Failed', details: [error] } }));
            setEraseStatuses(prev => ({ ...prev, [task]: 'error' }));
        }
    };
    
    const ResultAlert = ({ seedStatus, eraseStatus, result }: { seedStatus: SeedStatus, eraseStatus: SeedStatus, result: SeedResult | null }) => {
        const status = seedStatus !== 'idle' ? seedStatus : eraseStatus;
        if (status === 'idle' || status === 'loading') return null;
        
        const isSuccess = status === 'success';

        return (
            <Alert variant={isSuccess ? 'success' : 'destructive'}>
                {isSuccess ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
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
                    <CardTitle className="text-primary">Seed Initial Data</CardTitle>
                    <CardDescription className="text-muted-foreground">
                       Use these actions to populate or clear your Firestore database. Run these in order from top to bottom for best results.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Initial Seed */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Initial Users &amp; Quotes</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates the Super Admin user (`admin`/`admin`) and populates the database with inspirational quotes. **Run this first.**</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="destructive" onClick={() => handleErase('initial')} disabled={eraseStatuses.initial === 'loading'}>
                                    {eraseStatuses.initial === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase
                                </Button>
                                <Button onClick={() => handleSeed('initial')} disabled={statuses.initial === 'loading'}>
                                    {statuses.initial === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Initial Data
                                </Button>
                             </div>
                        </div>
                        <ResultAlert seedStatus={statuses.initial} eraseStatus={eraseStatuses.initial} result={results.initial} />
                    </div>

                    {/* Organization Profile */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary" />Organization Profile</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates the public-facing profile for your organization, including address, contact info, and bank details.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="destructive" onClick={() => handleErase('organization')} disabled={eraseStatuses.organization === 'loading'}>
                                    {eraseStatuses.organization === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase
                                </Button>
                                <Button onClick={() => handleSeed('organization')} disabled={statuses.organization === 'loading'}>
                                    {statuses.organization === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Organization
                                </Button>
                            </div>
                        </div>
                        <ResultAlert seedStatus={statuses.organization} eraseStatus={eraseStatuses.organization} result={results.organization} />
                    </div>
                    
                    {/* App Settings */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Application Settings</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds default configurations for lead purposes, user fields, and dashboard visibility. **Run this before creating leads.**</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="destructive" onClick={() => handleErase('appSettings')} disabled={eraseStatuses.appSettings === 'loading'}>
                                    {eraseStatuses.appSettings === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase & Reset
                                </Button>
                                <Button onClick={() => handleSeed('appSettings')} disabled={statuses.appSettings === 'loading'}>
                                    {statuses.appSettings === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed App Settings
                                </Button>
                            </div>
                        </div>
                        <ResultAlert seedStatus={statuses.appSettings} eraseStatus={eraseStatuses.appSettings} result={results.appSettings} />
                    </div>

                     {/* Core Team */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />Core Team Members</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds the user accounts for the organization's Founders, Co-Founders, and other Admins.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('coreTeam')} disabled={eraseStatuses.coreTeam === 'loading'}>
                                    {eraseStatuses.coreTeam === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase
                                </Button>
                                <Button onClick={() => handleSeed('coreTeam')} disabled={statuses.coreTeam === 'loading'}>
                                    {statuses.coreTeam === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Core Team
                                </Button>
                            </div>
                        </div>
                        <ResultAlert seedStatus={statuses.coreTeam} eraseStatus={eraseStatuses.coreTeam} result={results.coreTeam} />
                    </div>
                    
                    {/* Payment Gateways */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Payment Gateways</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds placeholder credentials for the Razorpay payment gateway to enable online donations in test mode.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('paymentGateways')} disabled={eraseStatuses.paymentGateways === 'loading'}>
                                    {eraseStatuses.paymentGateways === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase
                                </Button>
                                <Button onClick={() => handleSeed('paymentGateways')} disabled={statuses.paymentGateways === 'loading'}>
                                    {statuses.paymentGateways === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Gateways
                                </Button>
                            </div>
                        </div>
                        <ResultAlert seedStatus={statuses.paymentGateways} eraseStatus={eraseStatuses.paymentGateways} result={results.paymentGateways} />
                    </div>
                    
                    {/* Sync Users to Firebase Auth */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" />Sync Users to Firebase Auth</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates records in Firebase Authentication for users in your database, enabling them for OTP login. This can be run at any time.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('syncFirebaseAuth')} disabled={eraseStatuses.syncFirebaseAuth === 'loading'}>
                                    {eraseStatuses.syncFirebaseAuth === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase All Auth Users
                                </Button>
                                <Button onClick={() => handleSeed('syncFirebaseAuth')} disabled={statuses.syncFirebaseAuth === 'loading'}>
                                    {statuses.syncFirebaseAuth === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Sync Users
                                </Button>
                            </div>
                        </div>
                        <ResultAlert seedStatus={statuses.syncFirebaseAuth} eraseStatus={eraseStatuses.syncFirebaseAuth} result={results.syncFirebaseAuth} />
                    </div>

                    {/* Sample Data */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Sample Campaigns &amp; Leads</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates sample campaigns, beneficiaries, leads, and donations for demonstration purposes.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('sampleData')} disabled={eraseStatuses.sampleData === 'loading'}>
                                    {eraseStatuses.sampleData === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase
                                </Button>
                                <Button onClick={() => handleSeed('sampleData')} disabled={statuses.sampleData === 'loading'}>
                                    {statuses.sampleData === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Sample Data
                                </Button>
                            </div>
                        </div>
                        
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>View Details of What Will Be Created</AccordionTrigger>
                                <AccordionContent>
                                    <div className="text-sm text-muted-foreground space-y-4 pt-2">
                                        <p>This action will seed a variety of data to showcase the app&apos;s features, including:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li>
                                                <strong>General Historical Leads:</strong> 5 closed cases for various purposes like medical, loans, and education.
                                            </li>
                                            <li>
                                                <strong>Ramadan 2025 Campaign (Completed):</strong>
                                                <ul className="list-circle pl-5 mt-1 space-y-1">
                                                    <li>A ₹1,00,000 business loan lead for &quot;Salim Baig&quot;.</li>
                                                    <li>A ₹60,000 medical lead for a surgical operation.</li>
                                                    <li>10 leads for ₹4,000 ration kits.</li>
                                                    <li>7 leads for a ₹50,000 relief effort (shelter, ration kits).</li>
                                                    <li>20 dummy donors and their Zakat donations to cover the relief effort.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <strong>Winter Relief 2024 Campaign (Active):</strong> 2 open leads for winter kits.
                                            </li>
                                             <li>
                                                <strong>Ramadan 2026 Campaign (Upcoming):</strong> 2 leads for future ration kits.
                                            </li>
                                        </ul>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        
                        <ResultAlert seedStatus={statuses.sampleData} eraseStatus={eraseStatuses.sampleData} result={results.sampleData} />
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
